# Environment variable audit

This document lists **every variable the codebase reads** (directly or via tooling), whether it belongs in `.env`, and how critical it is. **Secrets must never be committed**; `.gitignore` includes `.env*`.

For deployment procedures and staging vs production, see [deployment.md](./deployment.md).

**Dominio de producción `prodemix.app`:** URLs, Google OAuth y checklist en [prodemix-app.md](./prodemix-app.md).

---

## Legend

| Tag | Meaning |
|-----|---------|
| **Required** | App or auth will fail at runtime without a sensible value (for that feature). |
| **Optional** | Feature degrades or is disabled when unset. |
| **CI/build** | Used during `next build` or CI (e.g. Sentry upload), not always needed at runtime. |
| **Injected** | Set by the host or Node (do not put in `.env` unless overriding). |

---

## Application and database

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `DATABASE_URL` | Required (deploy) | `prisma.config.ts` (fallback), `src/lib/prisma.ts`, `prisma/seed.ts` | Postgres URL (Neon: pooled, host con `-pooler`). |
| `DIRECT_URL` | Optional (Neon) | `prisma.config.ts` (migrate / Prisma CLI) | Misma base, **host sin `-pooler`**. Si está definida, `migrate deploy` la usa en lugar del pooler (más fiable para DDL). La app sigue usando `DATABASE_URL` en runtime. |
| `AUTH_SECRET` | Required (deploy) | `src/auth.ts`, `instrumentation.ts` (prod warning if missing) | `openssl rand -base64 32`. Unique per environment. |
| `AUTH_URL` | Strongly recommended | `src/lib/email/app-base-url.ts` (via helpers), Auth.js behavior | Public origin, **no trailing slash**. Prefer explicit value for OAuth and emails. |
| `NEXTAUTH_URL` | Optional | `src/lib/email/app-base-url.ts` | Legacy alias for `AUTH_URL`. |

---

## Authentication providers

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `GOOGLE_CLIENT_ID` | Optional (pair) | `src/auth.ts`, `src/app/login/page.tsx` | Ambas variables habilitan el botón "Continuar con Google" en `/login`. |
| `GOOGLE_CLIENT_SECRET` | Optional (pair) | `src/auth.ts` | En Google Cloud Console, redirect URI: `{AUTH_URL}/api/auth/callback/google` (sin barra final en `AUTH_URL`). |

---

## Email (transactional, Resend, reminders)

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `EMAIL_FROM` | Optional | `src/lib/email/send-email.ts` | Sender for transactional mail and SMTP fallback. |
| `EMAIL_SERVER` | Optional (with `EMAIL_FROM`) | `src/lib/email/send-email.ts` | SMTP URL for Nodemailer fallback when `RESEND_API_KEY` is unset. |
| `RESEND_API_KEY` | Optional | `src/lib/email/resend.ts`, `send-email.ts` | Enables Resend API path when set. |
| `CRON_SECRET` | Optional | `src/app/api/cron/reminders/route.ts` | Protects `GET /api/cron/reminders`. |
| `REMINDER_WINDOW_HOURS` | Optional | `src/lib/email/reminders/run-closing-reminders.ts` | Defaults to `24` if unset. |

---

## Admin

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `ADMIN_SECRET` | Optional | `src/lib/require-admin.ts`, `src/proxy.ts`, `src/app/api/admin/login/route.ts` | If unset, admin routes return 503 / are blocked. Cookie `secure` follows `NODE_ENV`. |

---

## Client (build-time `NEXT_PUBLIC_*`)

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | `instrumentation-client.ts`, Sentry server/edge fallbacks | DSN is public by design. |
| `NEXT_PUBLIC_VERCEL_ENV` | Optional | `instrumentation-client.ts` | Overrides Sentry environment label in the browser. |

---

## Observability (Sentry)

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `SENTRY_DSN` | Optional | `sentry.server.config.ts`, `sentry.edge.config.ts` | Server-only override; falls back to `NEXT_PUBLIC_SENTRY_DSN`. |
| `SENTRY_AUTH_TOKEN` | CI/build | `next.config.ts` | Source maps upload; **never commit**. |
| `SENTRY_ORG` | CI/build | `next.config.ts` | |
| `SENTRY_PROJECT` | CI/build | `next.config.ts` | |

---

## Runtime / platform (usually injected)

| Variable | Tag | Where used | Notes |
|----------|-----|------------|--------|
| `NODE_ENV` | Injected | Many | `development` \| `production` (test may set `test`). |
| `NEXT_RUNTIME` | Injected | `instrumentation.ts` | `nodejs` \| `edge`. |
| `VERCEL_URL` | Injected (Vercel) | `src/lib/email/app-base-url.ts` | Hostname only; used when `AUTH_URL` unset for email base URL. |
| `VERCEL_ENV` | Injected (Vercel) | Sentry configs | `production` \| `preview` \| `development`. |
| `CI` | Injected (CI) | `next.config.ts` (Sentry silent logs) | |

---

## Copy-paste template

Use the repository **`.env.example`** as the authoritative template for names and section order. Copy to `.env` locally only.
