# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

React 19 + Vite 8 SPA (ESM) with React Router 7, TipTap 3, Tailwind 3 and Axios, served on port 5173. See `AGENTS.md` for style and commit guidelines and `../agent_guide.md` §6 for details.

## Commands

- `npm run dev`, `npm run build`, `npm run preview`
- `npm run lint` (ESLint). Run it before finishing work.
- Set `VITE_API_URL` in `.env`. It is the only API base URL config, used by `src/api/axios.js` and `src/api/admin.js`.

There are no tests and no TypeScript.

## Architecture

- `src/App.jsx` holds all routes, and `main.jsx` sets up the providers. `layouts/` has `AuthLayout`, `DashboardLayout` and `AdminLayout`, and `ProtectedRoute` and `AdminRoute` guard them.
- Pages live under `pages/auth`, `pages/dashboard/{note,todo,journal}` and `pages/admin`.
- API clients live in `src/api/`. Don't duplicate request logic in pages.
- Backend responses vary in shape, so unwrap with `res?.data || res?.result || res`.
- `context/AuthProvider` refreshes the access token once at boot. There is no refresh-on-401, so an expired token mid-session needs a reload or a new login.
- Note bodies are TipTap HTML. Previews strip HTML with DOMParser (`NoteList.jsx`). Never use `dangerouslySetInnerHTML` without sanitizing.
- Layout state is persisted in localStorage: `sidebarCollapsed`, `isFoldersOpen`, `isTagsOpen`, `notelist_pane_open`, `notes_pinned_open`, `notes_unpinned_open`. Clear it if a pane "disappears".
- PWA is configured through `vite-plugin-pwa` in `vite.config.js`, and its icons live in `public/`.

## Styling

- Palette is mint and chocolate. Tailwind uses a custom zinc palette (950/900/850/800/700/600/500/400/300/200/100), which is chocolate brown in dark themes and mint-cream in light. It is backed by CSS variables in `src/index.css`. Shades outside the defined set fall back to fixed Tailwind greys that ignore the theme, so stick to the defined ones (also 600 and 300).
- The accent is `accent` / `accent-soft` / `accent-strong` (mint), with `text-accent-ink` for text on accent fills.
- Themes are `light`, `dark` and `black`, set through `data-theme` by `ThemeProvider`. There is no component library, so modals and menus are plain Tailwind.
- Icons come from `react-icons` (mostly `Lu*`), and toasts use `react-hot-toast`.

## Conventions

- Two-space indent, no semicolons, single quotes. Components are PascalCase files.
- Keep comments minimal, matching the existing code.
- Commit subjects are short and imperative with a prefix: `feat:`, `fix:`, `patch:`, `redesign:`.
