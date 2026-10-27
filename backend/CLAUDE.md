# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Express 5 + Prisma 6 + PostgreSQL API (CommonJS), served on port 6969. See `../agent_guide.md` §5 for the full route table and data model.

## Commands

- `docker compose up -d` starts PostgreSQL 15 and pgAdmin.
- `cp .env.example .env` creates the env file. `.env.example` is the source of truth for the variables.
- `npx prisma migrate dev` applies migrations and regenerates the client. Run it after any `prisma/schema.prisma` change.
- `npm run dev` runs nodemon. `npm start` runs node.

There are no tests and no lint. `npm test` is a stub.

## Architecture

- `src/server.js` mounts routers under `/api`. The middleware chain is cors, `express.json`, morgan, cookieParser, then `generalLimiter`.
- Protected routes run `verifyToken`, which sets `req.user` to the full Prisma user row. Admin routes also run `isAdmin`.
- Code is split into `routes/`, `controllers/`, `middlewares/`, `validators/`, `configs/` and `utils/`.
- Only `/auth` routes validate bodies with Zod (`validateRequest` + `validators/auth.validator.js`). Other controllers check inputs by hand. Keep the schemas in sync when adding auth endpoints.
- Responses are `{ status: "success", data | result | folder | journal }`, and errors are `{ error }`. The payload key varies per endpoint, so match the neighbouring controller.

## Auth

- Access token: 15 minutes, sent as a Bearer header. Refresh token: 7 days, in an httpOnly cookie. The cookie is `sameSite: lax` in dev and `none` + `secure` in production (`utils/generateToken.js`).
- Registration emails a 4-digit OTP, and login requires `isVerified`.
- The first registered user becomes `ADMIN`. An admin cannot delete their own account.
- `forgot-password` always returns a generic success to avoid user enumeration. Reset tokens are single-use and last 30 minutes, and `FRONTEND_URL` must be set or the emailed link breaks.

## Gotchas

- `utils/sendMail.js` sends all email through the Brevo HTTP API with raw axios. `configs/otp.js` (Nodemailer) is unused dead code.
- Notes and journals soft-delete with `isDeleted`/`deletedAt`. Permanent delete requires the item to already be in the trash.
- Note sharing: only the owner can add or remove editors. Pin, trash, restore and permanent delete check `userId` only. Note reads use `OR: [{ userId }, { editors: { some: { id } } }]`.
- Avatars go through multer into Cloudinary (`configs/upload.js`).
