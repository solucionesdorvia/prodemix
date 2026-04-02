# ProdeMix

Next.js app for futsal prediction pools (prodes), rankings, and admin tooling.

## Development

```bash
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, and optional providers — see docs/deployment.md

npm install
npm run db:migrate:dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and run |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test` | Unit tests (scoring, ranking, validation) |
| `npm run check` | Lint + typecheck + test + build |
| `npm run db:migrate:dev` | Local DB: apply migrations (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Staging/prod: apply migrations (`prisma migrate deploy`) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Run `prisma/seed.ts` (see deployment doc before prod) |

## Deployment

**Staging and production:** separate databases, secrets, and `AUTH_URL` values. Do not commit `.env`.

| Doc | Contents |
|-----|----------|
| **[docs/environment.md](./docs/environment.md)** | Full env var audit (what the code reads) |
| **[docs/deployment.md](./docs/deployment.md)** | Staging vs production, migrations, seed, auth, email, admin |
| [docs/email.md](./docs/email.md) | Transactional email and reminders |
| [docs/resend-setup.md](./docs/resend-setup.md) | Configurar Resend (API key, dominio, `EMAIL_FROM`) |
| [docs/security.md](./docs/security.md) | Security notes |

**Commands:** `npm run db:migrate:dev` (local), `npm run db:migrate:deploy` (staging/prod), `npm run db:seed` (when appropriate).
