# Agent Guide — Ramy Note App

This guide helps AI agents (and new developers) understand the **Ramy Note App** codebase before making changes.

> Quick overview, structure, and setup commands are in the repo **[README.md](./README.md)** — this guide covers the deep implementation details.

## 1. Project Overview

A full-stack note-taking application ("RAM Shortage") with:

- **Notes** — rich-text editing (TipTap), pinning, folders, tags, soft-delete trash, search, word count / read-time.
- **To-dos** — simple task list with due dates and done-state toggling.
- **Journals** — mood-based diary entries with active/trash views, restore, and permanent delete (fully implemented).
- **Auth** — register with email OTP verification, login, JWT access + refresh tokens, forgot/reset password via email reset link, profile settings (name/email/password/avatar).
- **Admin panel** — dashboard stats, list all users/notes, change roles, remove users.

Two separate apps live in a single repo:

| Directory | Stack |
|-----------|-------|
| `backend/` | Node.js + Express 5, Prisma ORM, PostgreSQL, JWT, Cloudinary, Brevo (email) |
| `frontend/` | React 19 + Vite 8, React Router 7, TipTap 3, Tailwind, Axios |

## 2. Environment Variables (backend `.env`)

Setup commands (docker compose, migrate, dev servers) are in **[README.md](./README.md)**. The backend `.env` file uses:

- `DATABASE_URL` — Postgres connection string used by Prisma.
- `FRONTEND_URL` — CORS origin (in `server.js`) **and** frontend base URL used to build the password-reset link (`${FRONTEND_URL}/reset-password?token=...`) in `auth.controller.js`.
- `PORT`, `NODE_ENV` — production enables secure cookies and `sameSite: none` on the refresh cookie.
- `ACCESS_SECRET` / `REFRESH_SECRET` / `JWT_EXPIRES_IN` — JWT secrets and refresh lifetime (default `7d`).
- `BREVO_API_URL` / `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` — Brevo (Sendinblue) API used by `utils/sendMail.js` for **all** transactional email (OTP, reset link). Sent as raw `axios` POSTs — Nodemailer is no longer used.
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Cloudinary credentials read by `configs/cloudinary.js` for avatar uploads.

> **Notes:** `.env.example` is the source of truth and already lists everything above (including `FRONTEND_URL` and all `BREVO_*` vars) — copy it as-is when provisioning. `DOCKER_URL` and the SMTP vars (`SMTP_USER`/`SMTP_PASS`/`RESEND_API_KEY`) were **removed** from the example: `DOCKER_URL` survives only as a commented line in `schema.prisma`, and `configs/otp.js` (which still reads the SMTP vars) is **unused dead code** (nothing imports it).

## 3. Repository Layout

```
Ramy (Note-app)/
├── README.md                 # quick overview, structure, setup
├── agent_guide.md            # this file (deep implementation details)
├── backend/
│   ├── docker-compose.yml    # postgres + pgadmin
│   ├── prisma/
│   │   ├── schema.prisma     # data model
│   │   └── migrations/       # migration history
│   ├── prisma.config.ts      # Prisma 6 config (schema + datasource)
│   └── src/
│       ├── server.js         # app entry, middleware, route mounting
│       ├── configs/          # db.js (Prisma client), cloudinary.js, upload.js (multer), otp.js (unused)
│       ├── controllers/      # request handlers per feature
│       ├── middlewares/      # verifyToken, isAdmin, rateLimiter, validateRequest
│       ├── routes/           # Express routers per feature
│       ├── utils/            # generateToken.js, sendMail.js
│       └── validators/       # auth.validator.js (Zod schemas for /auth routes)
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js    # custom zinc palette + mint accent + fonts
    └── src/
        ├── main.jsx          # providers: BrowserRouter > AuthProvider > ThemeProvider
        ├── App.jsx           # all routes + toast config
        ├── index.css         # Tailwind + zinc CSS variables
        ├── api/              # axios.js (feature APIs), admin.js
        ├── assets/           # ram.png
        ├── components/       # Sidebar, modals/, ProtectedRoute, AdminRoute, AvatarUpload, RoleDropdown
        ├── context/          # AuthProvider, ThemeProvider
        ├── error/            # NotFound.jsx
        ├── layouts/          # AuthLayout, DashboardLayout, AdminLayout
        ├── pages/            # auth/, dashboard/ (note/, todo/, journal/), admin/
        └── utils/            # localColors.js
```

## 4. Data Model (backend/prisma/schema.prisma)

Prisma client provider is `prisma-client-js`, datasource `postgresql`. All IDs are UUID strings. All `@relation(...)` relations have `onDelete: Cascade` (except note→folder, which is `SetNull`).

- **Users** — `name`, unique `email`, hashed `password`, optional `image` (Cloudinary URL), `role` (`RoleList`: `ADMIN` | `USER`), `isVerified` (email OTP). First registered user auto-becomes `ADMIN` (`userCount === 0` in `auth.controller.js:55`).
- **Notes** — optional `title`/`body` (body stores TipTap HTML), `isPinned`, `updatedAt` (`@updatedAt`, also set manually in `updateNote`), soft delete via `isDeleted` + `deletedAt`, optional `folderId`. Owner relation `"Owner"`; implicit many-to-many `editors` (`"Editor"`) for shared editing; implicit m2m with `Tags`.
- **Todos** — `title`, `isDone`, optional `dueDate`.
- **Journals** — optional `title`, required `body`, optional `mood` (`Mood` enum: HAPPY, SAD, TIRED, ANXIOUS, EXCITED, NEUTRAL), `entryDate`, soft delete via `isDeleted`/`deletedAt`.
- **Tags** — `tag` + `userId`, `@@unique([tag, userId])`. Connected to notes via implicit m2m.
- **Folders** — just `name` + `userId`. Deleting a folder sets its notes' `folderId` to `null` (transaction in `folder.controller.js:96`).
- **Otps** — `email`, `otp`, `expiresAt` (5 min), not tied to a user row.
- **ResetTokens** — `email`, unique `token` (32-byte `crypto` hex, 64 chars), `expiresAt` (30 min), not tied to a user row. Created on forgot-password (old tokens for that email are cleared first via `deleteMany`), single-use — deleted after a successful reset.

The editor m2m on Notes (`editors`) is **fully implemented**: the owner adds/removes editors via the API (`POST` / `DELETE /api/notes/:id/editors`) and from the NoteEditor "Manage" button. Editors get read + update access to the shared note; pin/soft-delete/restore/permanent-delete stay owner-only (see §5/§6).

## 5. Backend Architecture

### Request flow

`server.js` mounts routers at `/api/...`. Middleware chain: `cors` → `express.json()` → `morgan` → `cookieParser` → `generalLimiter`. Every protected route runs `verifyToken`, which reads the access token from `Authorization: Bearer <token>` (or cookie fallback) and sets `req.user` to the full Prisma user row.

### Auth flow (important)

- `POST /api/auth/register` → hashes password, creates user (role ADMIN if first), sends 4-digit OTP email, does NOT log in.
- `POST /api/otp/request` & `POST /api/otp/verify` → verify sets `isVerified: true`.
- `POST /api/auth/forgot-password` → generates a 32-byte hex token (30 min expiry), stores it in `ResetTokens` (clearing old ones for the email), and emails `FRONTEND_URL/reset-password?token=...` via Brevo. Returns a generic success message even if the email doesn't exist (avoids user enumeration).
- `POST /api/auth/reset-password` → validates token + expiry, hashes the new password, updates the user, deletes the token.
- `POST /api/auth/login` → checks `isVerified`, returns `{ accessToken, data: {id, name, email, image, role} }` and sets an httpOnly `refreshToken` cookie (7d; `sameSite: lax` in dev, `sameSite: none` + `secure` in production). The frontend `Login` page normalizes `image`/`avatar` before storing the user.
- `POST /api/auth/refresh` → reads cookie, returns a new `accessToken` + user object. The frontend calls this on app mount to restore the session.
- Access token expires in **15 minutes** (`utils/generateToken.js`). There is currently **no automatic access-token refresh on 401 in the frontend**; `AuthProvider` only refreshes once at boot.

### API routes (all mounted under `/api`)

| Route | Methods | Notes |
|-------|---------|-------|
| `/auth` | refresh, register, login, logout, current-user, change-name, change-email, change-password, change-avatar (multipart), forgot-password, reset-password | avatar via multer→Cloudinary; reset link via Brevo; register/login/forgot-password/reset-password run `authLimiter`; all body-bearing routes run `validateRequest` with Zod schemas from `validators/auth.validator.js` |
| `/otp` | request, verify | |
| `/notes` | GET list, POST, GET `/:id`, PUT `/:id`, PATCH `/:id` (togglePin), DELETE `/:id` (soft delete), `/:id/restore`, `/:id/permanent`, POST `/:id/editors` (add editor), DELETE `/:id/editors` (remove editor) | supports `?trash=true`, `?tag=`, `?pinned=`, `?search=`, pagination |
| `/folders` | GET list, POST, GET `/:id`, PATCH `/:id`, DELETE `/:id` | |
| `/tags` | GET list, POST, PATCH `/:id`, DELETE `/:id` | |
| `/todos` | GET list, POST, PATCH `/:id`, `/:id/toggle`, DELETE `/:id` | |
| `/journals` | GET list, POST, GET `/:id`, PUT `/:id`, DELETE `/:id` (soft delete), `/:id/restore`, `/:id/permanent` | supports `?trash=true` |
| `/admin/dashboard` | dashboard-stats, all-users, all-notes, change-user `/:id`/role, remove-user `/:id` | verifyToken + isAdmin |

### Key conventions in controllers

- Responses are wrapped as `{ status: "success", message?, data? | result? | folder? | journal? }`. The response key varies by endpoint (`data`, `result`, `folder`, `journal`) — frontend helpers defensively unwrap all of them (`res?.data || res?.result || res`).
- Errors: `{ error: "message" }` with 4xx/5xx status.
- Ownership checks are done per-resource (compare `req.user.id`). Notes also allow editors.

### Middlewares

- `verifyToken.js` — Bearer or cookie token → `req.user`.
- `isAdmin.js` — blocks non-ADMIN (`403`).
- `rateLimiter.js` — `generalLimiter` (10k/15min, global), `authLimiter` (5/15min, login/register/forgot-password/reset-password), `otpLimiter` (3/5min, OTP request).
- `validateRequest.js` — Zod schema validation for any route with a `req.body`; on failure returns `400` with the joined issue messages. Only wired up on `/auth` routes; schemas live in `src/validators/auth.validator.js`.

### Configs & utils

- `configs/db.js` — Prisma client singleton (`prisma`).
- `configs/upload.js` + `cloudinary.js` — multer with Cloudinary storage, folder `ramy-note-app/avatars`, 300×300 fill crop.
- `utils/sendMail.js` — `sendOtp` / `sendSuccess` / `sendResetLink`; sends **all** email via the Brevo API (`axios` POST to `BREVO_API_URL`), no Nodemailer involved.
- `configs/otp.js` — Nodemailer transporter (Resend SMTP prod / Gmail dev); currently **unused dead code** (kept for reference).
- `utils/generateToken.js` — access (15m) + refresh (7d) tokens; refresh cookie is `httpOnly`, `sameSite: lax` in dev and `sameSite: none` + `secure` in production (`generateToken.js:15`). Note: the `logout` handler clears the cookie with `sameSite: "strict"` (`auth.controller.js:128`) — a mismatch that works in practice but is worth knowing about if dev cookie issues come up.

## 6. Frontend Architecture

### Providers & routing (`main.jsx`, `App.jsx`)

```
BrowserRouter > AuthProvider > ThemeProvider > App
```

Routes in `App.jsx`:
- **AuthLayout**: `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` (the latter reads `?token=` from the emailed reset link)
- **DashboardLayout** (wrapped in `ProtectedRoute`): `/` (welcome — a centered "Welcome back, {name}" screen with a "Go to My Notes" button), `/notes/:id?`, `/folders/:folderId/:noteId?`, `/tags/:tagId/:noteId?`, `/trash/:id?` (renders the dedicated `Trash` page), `/todos`, `/journals`, `/journal`, `/journal/:id`, `/journal/trash`, `/journal/trash/:id`, `/settings`
- **AdminLayout** (wrapped in `AdminRoute`): `/admin`
- `*` → `NotFound.jsx`

### Contexts

- `AuthProvider` — holds `accessToken`, `user`, `loading`. On mount calls `/auth/refresh` to restore the session and normalizes `image`/`avatar` keys. No interceptor logic exists for token refresh-on-401.
- `ThemeProvider` — `light` / `dark` / `black` / `system`; sets `data-theme` attribute and toggles `.dark` class. `system` listens to `prefers-color-scheme`.

### API layer (`src/api/axios.js`)

Plain axios wrappers (not a shared instance). Every authed call passes `Authorization: Bearer <accessToken>` and `withCredentials: true` (needed for refresh cookie). Base URLs are hardcoded to `VITE_API_URL`. `forgotPassword`/`resetPassword` are the only auth helpers that don't attach the bearer header (they run pre-login). `addEditor`/`removeEditor` hit `POST`/`DELETE /api/notes/:id/editors` (removeEditor sends the email in the request body via axios `data`).

### Pages

- **note/** — `Note.jsx` (two-pane container: list + editor), `Trash.jsx` (same layout for `/trash`, wires `NoteList` + `NoteEditor` with `isTrash`), `NoteList.jsx`, `NoteEditor.jsx` (TipTap rich text editor).
  - **Collapsible list pane**: `Note.jsx` keeps `isListOpen` (persisted in localStorage under `notelist_pane_open`). On desktop the toggle (`LuPanelLeftClose`, "Hide Note List") sits in the NoteList header; when collapsed the pane collapses to `sm:w-0` with `overflow-hidden` and an expand button (`LuPanelLeftOpen`, "Expand Note List") floats over the editor. On mobile the list is full-width while no note is selected and the editor takes over once one is (a back button clears the selection). When nothing is selected on desktop, the editor pane shows a "Pick a note or start writing" empty state.
  - `NoteList.jsx` — search, time filters, pin, trash actions — sorts by `updatedAt || createdAt`. Pinned/Notes sections are independently collapsible with their open state persisted in localStorage (`notes_pinned_open` / `notes_unpinned_open`); each card shows a relative timestamp + word count.
  - **Autosave**: `NoteEditor` debounces saves by 800ms via refs (`titleRef`, `isPinnedRef`, `selectedTagsRef`, `activeNoteIdRef`) so stale closures don't clobber newer content. Editor content is stored as HTML in `notes.body`. On save it reads back `res.data.data.updatedAt` to update the "Last Modified" timestamp.
  - **Sharing**: `NoteEditor` renders a metadata section with owner ("Created by", from `getNoteId`'s included `user`), an editors count + **Manage** button (owner-only, hidden in trash mode) that opens a modal to add/remove editors by email via `addEditor`/`removeEditor`. `getNoteId` includes `image` on both `user` and `editors`. Hovering the editor count opens a popover listing each editor with their avatar (`avatarUrl = ed.image || ed.avatar || ed.picture` fallback). Add/remove actions track per-editor loading state via the `editorAction` object (`{type: "add"}` / `{type: "remove", email}`): the email input, Add button, and all remove buttons are disabled while an action is in flight, and the editor being removed shows a "Removing..." state.
  - **Trash mode**: `NoteEditor` takes an `isTrash` prop — the toolbar hides pin / folder / new-note actions and instead offers Restore + Delete Forever (permanent delete is confirmed via `ConfirmModal`). Trash notes are fetched with `getNoteId(id, token, { trash: true })`.
  - Folder/tag filtering on the list is done **client-side** after fetching all notes (with `?trash=true` passed for the trash view).
- **todo/** — `Todo.jsx` fully implemented (add, toggle, delete, filter tabs, optimistic UI with revert).
- **journal/** — fully implemented. `Journal.jsx` (container: fetches active + trash lists via `Promise.all`, active/trash view toggle, create/edit/soft-delete/restore/permanent-delete handlers), `JournalEditor.jsx`, `JournalList.jsx` (search, edit, soft-delete), `JournalTrash.jsx` (restore + permanent delete). Trash journals are fetched with `getJournals(token, { trash: true })`.
- **auth/** — Login (normalizes `image`/`avatar` on sign-in; links to `/forgot-password`), Register, VerifyOTP, ForgotPassword (email form → success message), ResetPassword (reads `?token=`; on success redirects to `/login` after 1.5s), Setting (profile changes), Logout.
- **admin/** — `AdminDashboard.jsx` uses `src/api/admin.js`.

### Components

- `Sidebar.jsx` — collapsible nav (persisted in localStorage) with a Trash link, folders + tags sections with create/edit/delete modals and a right-click context menu (coordinates clamped to the viewport). Folder/tag colors come from `utils/localColors.js` (localStorage map keyed by id). Admin link shown only when `user.role === "ADMIN"`. Responsive: on desktop it collapses to a 64px icon rail; on mobile it's a slide-in overlay driven by `DashboardLayout` (fixed positioning + backdrop) and takes an `onCloseMobile` prop to close on navigation.
- `DashboardLayout.jsx` — responsive shell: `flex-col` on mobile (top bar with the `ram.png` logo + "Ramy" wordmark and a hamburger that opens the sidebar overlay) vs `flex-row` on desktop (fixed sidebar). Renders the global `SearchModal`.
- `modals/` — `ModalPortal` (generic `createPortal(children, document.body)` wrapper), `FolderModal`, `DeleteFolderModal` (mode: delete notes or keep them), `TagModal`, `DeleteTagModal`, `SearchModal`, `ConfirmModal` (generic destructive-action confirm, replaces `window.confirm` for permanent note delete).
- `SearchModal` is rendered globally in `DashboardLayout` as a plain `<div id="searchModal">`; the Sidebar search button triggers it via `document.getElementById("searchModal").showModal()` (the component shims `showModal`/`close` onto itself). It live-searches notes by title/content, filters by multi-select tag pills, animates open/close, dismisses on Escape/backdrop click, and routes to `/notes/:id`.
- `ProtectedRoute.jsx` / `AdminRoute.jsx` — auth / role guards (redirect to login/admin home as appropriate).
- `AvatarUpload.jsx`, `RoleDropdown.jsx` — used in settings / admin pages.

### Styling

- Tailwind with a **custom zinc palette** (950/900/850/800/700/600/500/400/300/200/100) backed by CSS variables in `src/index.css`; shades outside that set (e.g. `zinc-50`) fall back to fixed Tailwind greys that ignore the theme.
- The global `user-select: none` rule in `src/index.css` is **disabled** (commented out), so app text is user-selectable.
- Themes: `light`, `dark`, `black` (via `data-theme`, no component library). Palette is mint and chocolate, with the accent in `accent`, `accent-soft` and `accent-strong`. Fonts: Belanosima, Instrument Sans, Noto Sans Khmer.
- Icons: `react-icons` — `Lu*` (lucide) is the dominant family; some `Io5`, `Pi`, `Go`, `Ri` icons appear in the Sidebar. `react-hot-toast` is the toast library.

## 7. Conventions & Gotchas

- **No TypeScript, no tests.** Lint only: `npm run lint` in `frontend/`. The backend has no lint/test setup (`npm test` is a stub).
- **CommonJS backend** (`"type": "commonjs"`), ESM frontend.
- **Prisma 6**: config lives in `prisma.config.ts`; run `npx prisma migrate dev` after schema changes and regenerate the client.
- **Response shapes differ per endpoint** — always unwrap defensively (`res?.data || res?.result || res`).
- **API base URLs are hardcoded** to `VITE_API_URL` in `frontend/src/api/axios.js` and `frontend/src/api/admin.js`. There is no Vite proxy / env-based URL config.
- **Note body is HTML** (TipTap). Never render note previews with `dangerouslySetInnerHTML` without sanitizing; previews strip HTML via DOMParser (`NoteList.jsx:25`).
- **Session caveat**: access token is only refreshed once at boot (`AuthProvider`). If a 401 occurs mid-session, the app does not auto-refresh — user must reload/login again. The refresh cookie is `sameSite: lax` in dev but `sameSite: none` (requires `secure`) in production.
- **Request validation**: only `/auth` routes validate bodies with Zod (`middlewares/validateRequest.js` + `validators/auth.validator.js`). Other routes do manual checks in their controllers. The `changeEmailSchema`/`changePasswordSchema`/`resetPasswordSchema` require the current password/token — schemas must stay in sync with any new auth endpoints.
- **Persisted UI state**: several components keep layout state in localStorage — `sidebarCollapsed`, `isFoldersOpen`, `isTagsOpen`, `notelist_pane_open` (Note.jsx list pane), `notes_pinned_open` / `notes_unpinned_open` (NoteList sections). Clear localStorage if the UI "loses" a pane.
- **Note sharing**: only the owner can add/remove editors (`addEditor`/`removeEditor` check `note.userId`); editors can read + edit the note body/title/tags but **cannot** pin, trash, restore, or permanently delete it — those handlers check `userId` only. Shared notes are fetched via the `OR: [{ userId }, { editors: { some: { id } } }]` filter in `getNotes`/`getNoteId`.
- **Email**: `utils/sendMail.js` is the only active sender — the Brevo API (`BREVO_*` vars). `configs/otp.js` (Nodemailer/Resend) is dead code.
- **Password reset**: `POST /api/auth/forgot-password` always returns a generic success (no user enumeration); reset tokens are single-use and expire after 30 minutes. `FRONTEND_URL` must be set or the emailed link is broken (`undefined/reset-password?...`).
- **Soft delete**: notes use `isDeleted`/`deletedAt`; permanent delete requires the note to already be in the trash (`note.controller.js:289`).
- **First registered user** becomes ADMIN automatically; guard rails in `admin.controller.js` prevent an admin from deleting their own account.
- **Journals** use the same soft-delete pattern as notes: `isDeleted`/`deletedAt`, `DELETE /:id` moves to trash, `PATCH /:id/restore` restores, `DELETE /:id/permanent` requires the journal to already be in the trash (`journal.controller.js:145`).
- Do not add code comments unless the surrounding code already uses them sparingly (the codebase uses minimal comments).
