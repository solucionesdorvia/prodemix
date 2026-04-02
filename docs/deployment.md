# Deployment and environments

How to run ProdeMix in **staging** and **production** on your chosen host (Vercel, Railway, Render, Fly.io, Docker, etc.). This doc does **not** mandate a provider: apply the same env and database steps wherever you deploy.

**Secrets stay out of git** (`.gitignore` includes `.env*`). Configure variables in the host UI or secret manager.

**Full variable list and audit:** [environment.md](./environment.md)

---

## 1. Staging vs production

| Topic | Staging | Production |
|-------|---------|------------|
| **Goal** | QA, demos, testing integrations | Live users |
| **`DATABASE_URL`** | Dedicated Postgres instance | **Different** database — never share credentials with staging |
| **`AUTH_SECRET`** | Own random value | **Different** from staging |
| **`AUTH_URL`** | Staging canonical URL (`https://staging.example.com`) | Production domain (`https://app.example.com`) — **no trailing slash** |
| **OAuth redirects** | Register staging URLs in Google (etc.) | Production URLs only in prod OAuth client (or separate OAuth clients per env) |
| **Seed data** | OK to run `db:seed` on empty DB when useful | Only if your seed is safe for prod (usually **avoid** destructive seeds) |
| **Cron / reminders** | Optional test secret + staging URL | Real `CRON_SECRET` + production base URL |

**Preview deployments** (e.g. pull-request URLs): treat as ephemeral. Email base URL can fall back to `VERCEL_URL` when `AUTH_URL` is unset; OAuth often **will not work** on random preview URLs unless you register each redirect URI. Prefer a fixed **staging** environment for OAuth testing.

---

## 2. Required variables for a live deploy

Minimum for database + sessions:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (Neon: pooled, host con `-pooler`; `?sslmode=require`). |
| `DIRECT_URL` | Opcional en Neon: misma base con host **sin** `-pooler`. Si la definís, `prisma migrate deploy` (incluido en `npm start`) usa esta URL para DDL; evita fallos raros con el pooler. La app sigue usando `DATABASE_URL` en runtime. |
| `AUTH_SECRET` | `openssl rand -base64 32` — unique per environment. |

Strongly recommended:

| Variable | Purpose |
|----------|---------|
| `AUTH_URL` | Public site origin (Auth.js, links). Omit only if you accept defaults; explicit value avoids callback/link bugs. |

Everything else is optional and feature-specific (Google, email, admin, Sentry, cron). See [environment.md](./environment.md).

---

## 3. Database: migrations and seed

Prisma config: `prisma.config.ts` (migrations path, seed command). Client output: `src/generated/prisma` (see `prisma/schema.prisma`).

### First-time / local development

With `DATABASE_URL` in `.env`:

```bash
npx prisma migrate dev
```

Creates or updates the DB from migration history and regenerates the client.

### Staging / production (existing pipeline)

Apply **committed** migrations only — no interactive prompts:

```bash
npx prisma migrate deploy
```

Run with `DATABASE_URL` pointing at the **target** database (staging or production). Typical options:

- **Release phase** or **pre-deploy** job on your host
- **CI** job before traffic switch
- One-off shell with production env (restricted access)

Do **not** run `migrate dev` against production.

### Generate client (CI / Docker build)

```bash
npx prisma generate
```

`npm run check` / GitHub Actions run this before `next build` when `DATABASE_URL` is available.

### Build on Railway, Render, Docker, etc.

The Prisma client is emitted to `src/generated/prisma` and is **gitignored**, so a fresh clone must run **`prisma generate`** before **`next build`**.

This repo runs generation in **`postinstall`** and again in **`build`** (`prisma generate && next build`). **`prisma`** and **`dotenv`** (used by `prisma.config.ts`) are **dependencies** so `postinstall` works even when install omits dev-only tooling.

**Producción en Railway:** **`railway.toml`** fija **`numReplicas = 1`** (evita varios `migrate` a la vez). **`npm start`** ejecuta **`npm run db:migrate:deploy:neon`** (migrate con **`PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK`**) y luego **`next start`**. No usamos **preDeploy** en Railway porque suele fallar con otro entorno que el runtime. Si escalás a más réplicas, corré migraciones en CI o un job aparte.

### Seed

Configured in `prisma.config.ts` as `tsx prisma/seed.ts`. Run only when appropriate:

```bash
npm run db:seed
# equivalent: npx prisma db seed
```

- **Staging / new dev DB:** common.
- **Production:** only if the seed is idempotent and safe for your data policy; many teams **never** seed production.

---

## 4. npm scripts (reference)

| Script | Command | Use |
|--------|---------|-----|
| `start` | `db:migrate:deploy:neon && next start` | Producción: migrate + Next; Railway `numReplicas=1` en `railway.toml` |
| `db:migrate:dev` | `prisma migrate dev` | Local: create/apply migrations interactively |
| `db:migrate:deploy` | `prisma migrate deploy` | Staging/prod: apply pending migrations |
| `db:generate` | `prisma generate` | Regenerate client (CI, after schema change) |
| `db:seed` | `prisma db seed` | Run `prisma/seed.ts` |

---

## 5. Auth providers (Auth.js v5)

- **`AUTH_SECRET`** — session/cookie signing.
- **`AUTH_URL`** — should match the URL users open in the browser.

**Email y contraseña (cuenta local):** registro con `POST /api/auth/register` y login con el proveedor `credentials`. Las contraseñas se guardan como hash bcrypt en `User.passwordHash`. Aplicá la migración `20260402160000_user_password_hash` (o `prisma migrate deploy`) si actualizás un deploy que no tenga esa columna.

**Google OAuth:** set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. In Google Cloud Console, add redirect URI:

`https://<your-domain>/api/auth/callback/google`

El proveedor Google tiene **vinculación por email** habilitada: si el usuario ya se registró con email y contraseña, puede entrar con Google usando el mismo correo (se asocia la cuenta de Google al usuario existente).

Si el correo ya existe con otro método y no querés usar Google, el registro por contraseña responde conflicto: iniciá sesión con el método que ya usaste.

---

## 6. Email and cron

Transactional email and reminders: `EMAIL_FROM`, `RESEND_API_KEY` and/or `EMAIL_SERVER`. Details: [email.md](./email.md).

| Variable | Role |
|----------|------|
| `CRON_SECRET` | `Authorization: Bearer <CRON_SECRET>` (or `?secret=`) on `GET /api/cron/reminders` |
| `REMINDER_WINDOW_HOURS` | Optional; default `24` |

Schedule the cron URL with your scheduler (host cron, GitHub Actions, external ping).

---

## 7. Admin

`ADMIN_SECRET` — used at `/api/admin/login`. Without it, admin APIs respond with **503** and `/admin` is blocked by middleware.

---

## 8. Observability

Optional: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, and CI-only `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` for source maps. DSN is not a secret; tokens are.

---

## 9. Host-agnostic checklist

Use any provider; steps are the same in principle:

1. Create Postgres → set `DATABASE_URL` for that environment.
2. Run `npx prisma migrate deploy` (or your release command) against that DB.
3. Set `AUTH_SECRET`, `AUTH_URL`, and auth/email vars as needed.
4. Deploy the app with env vars in the host dashboard (not in the repo).
5. Verify OAuth redirect URIs and email DNS (SPF/DKIM) for production.

---

## 10. Local development

```bash
cp .env.example .env
# Fill DATABASE_URL, AUTH_SECRET, …

npm install
npx prisma migrate dev
npm run dev
```

See [environment.md](./environment.md), [email.md](./email.md), and [security.md](./security.md).
