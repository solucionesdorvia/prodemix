# Correo transaccional (alcance actual)

**Configuración paso a paso de Resend (API key, dominio, `EMAIL_FROM`):** [resend-setup.md](./resend-setup.md)

Implementado en esta base:

1. **Resend** — `src/lib/email/resend.ts` (`getResendClient`, `isResendConfigured`).
2. **Envío** — `src/lib/email/send-email.ts` (prioridad: `RESEND_API_KEY` + SDK; si no, `EMAIL_SERVER` + Nodemailer).
3. **Plantillas** — `src/lib/email/templates/layout.ts` (HTML base) y `templates/prode-reminder.ts` (recordatorio de cierre).
4. **Preferencias** — modelo `NotificationPreference` en Prisma (`remindersEnabled`, `closingAlertEnabled`); lectura/escritura vía `GET`/`PATCH` `/api/me/profile`.
5. **Recordatorios** — `src/lib/email/reminders/run-closing-reminders.ts` y `sendProdeClosingReminderEmail`.
6. **Cron (solo disparador)** — `GET /api/cron/reminders` con `Authorization: Bearer <CRON_SECRET>` (o `?secret=`). No incluye programación externa.

Variables: ver `.env.example` y [deployment.md](./deployment.md) (`EMAIL_FROM`, `RESEND_API_KEY`, `EMAIL_SERVER`, `CRON_SECRET`, `REMINDER_WINDOW_HOURS`, `AUTH_URL`). En Vercel, `VERCEL_URL` se usa como respaldo para links si no definís `AUTH_URL`.

Enlace mágico de login: si usás correo, configurá `EMAIL_SERVER` + `EMAIL_FROM` para el proveedor Nodemailer estándar de Auth.js (plantillas por defecto del proveedor).
