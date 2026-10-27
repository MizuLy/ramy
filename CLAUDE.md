# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Monorepo with two separate apps. Each has its own `CLAUDE.md` with commands, architecture and gotchas:

- `backend/` is Express 5 + Prisma + PostgreSQL (CommonJS) on port 6969. See `backend/CLAUDE.md`.
- `frontend/` is React 19 + Vite 8 (ESM) on port 5173. See `frontend/CLAUDE.md`.

`README.md` has the overview and setup, and `agent_guide.md` has the deep details (data model, route table, gotchas).

## Cross-app notes

- Both apps must run together. Backend CORS allows `FRONTEND_URL`, and the frontend reads `VITE_API_URL`.
- Backend responses vary in shape (`data`, `result`, `folder`, `journal`). The frontend unwraps them defensively, so keep both sides consistent when changing an endpoint.
- Auth uses a 15-minute Bearer access token plus an httpOnly refresh cookie. The frontend refreshes once at boot, with no refresh-on-401.
- There are no tests. Run `npm run lint` in `frontend/` before finishing work.
- Commit subjects are short and imperative with a prefix: `feat:`, `fix:`, `patch:`, `redesign:`.
