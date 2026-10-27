# Ramy Note App

A full-stack note-taking application ("RAM Shortage") with notes (rich-text, pin, folders, tags, shareable editors, trash, search), to-dos, journals, email-OTP auth, forgot/reset password, and an admin panel.

> For deep implementation details (data model, request flow, gotchas), see **[agent_guide.md](./agent_guide.md)**.

## Tech Stack

| Directory | Stack |
|-----------|-------|
| `backend/` | Node.js + Express 5, Prisma ORM, PostgreSQL, JWT, Cloudinary, Brevo (email) |
| `frontend/` | React 19 + Vite, React Router 7, TipTap 3, Tailwind, Axios |

## Repository Structure

```
Ramy (Note-app)/
├── README.md                   # this file
├── agent_guide.md              # deep agent/onboarding guide (full tree in §3)
├── backend/                    # Express REST API (CommonJS) — Node + Express 5 + Prisma
│   ├── prisma/                 # schema.prisma (data model) + migrations/
│   └── src/
│       ├── server.js           # app entry, mounts routers at /api
│       ├── configs/            # db, cloudinary, upload (multer), otp
│       ├── controllers/        # per-feature request handlers
│       ├── middlewares/        # verifyToken, isAdmin, rateLimiter, validateRequest
│       ├── routes/             # Express routers (auth, otp, notes, folders, tags, todos, journals, admin)
│       ├── utils/              # generateToken.js, sendMail.js
│       └── validators/         # auth.validator.js (Zod schemas for /auth routes)
└── frontend/                   # React SPA (ESM) — React 19 + Vite + TipTap
    └── src/
        ├── main.jsx / App.jsx  # providers + all routes
        ├── api/                # axios.js (feature APIs), admin.js
        ├── components/         # Sidebar, modals/ (incl. ModalPortal, SearchModal), ProtectedRoute, AdminRoute, AvatarUpload, RoleDropdown
        ├── context/            # AuthProvider, ThemeProvider
        ├── error/              # NotFound.jsx
        ├── layouts/            # AuthLayout, DashboardLayout, AdminLayout
        ├── pages/              # auth/, dashboard/ (note/, todo/, journal/), admin/
        └── utils/              # localColors.js
```

## Getting Started

**Backend** (port 6969):
```bash
cd backend
docker compose up -d            # PostgreSQL 15 + pgAdmin
cp .env.example .env            # fill in secrets (see agent_guide.md)
npm install
npx prisma migrate dev
npm run dev
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

Both apps must run together — backend CORS allows whatever `FRONTEND_URL` is set to (e.g. `http://localhost:5173` in dev). Run `npm run lint` in `frontend/` before finishing work.

## Key Conventions

- **API routes** are mounted under `/api`; responses vary per endpoint (`data`, `result`, `folder`, `journal`) — unwrap defensively (`res?.data || res?.result || res`).
- **Auth**: access token (15m, Bearer) + httpOnly refresh token cookie (7d; `sameSite: lax` in dev, `none` + secure in prod). Frontend refreshes only once at boot.
- **Note sharing**: owners can add/remove editors (`POST`/`DELETE /api/notes/:id/editors`, or the NoteEditor "Manage" button); editors get read + edit access, while pin/trash/restore/permanent-delete stay owner-only. Hover the editor count to preview the editor list (avatars included).
- **Forgot/reset password**: `POST /api/auth/forgot-password` emails a 30-min reset link (`FRONTEND_URL/reset-password?token=...`) via Brevo; `POST /api/auth/reset-password` consumes the single-use token.
- **Notes & Journals** use soft delete (`isDeleted`/`deletedAt`) with trash + restore + permanent-delete endpoints.
- **First registered user** automatically becomes `ADMIN`.

> Full conventions, gotchas, and line-level details: **[agent_guide.md §7](./agent_guide.md#7-conventions--gotchas)**.
