# Configurar Resend (correo transaccional)

ProdeMix usa [Resend](https://resend.com) para enviar correos (recordatorios, plantillas propias). El SDK está en `src/lib/email/resend.ts`; el envío unificado en `src/lib/email/send-email.ts`.

## 1. Crear cuenta y API key

1. Entrá a [resend.com](https://resend.com) y creá cuenta.
2. En el dashboard: **API Keys** → **Create API Key**.
3. Nombrá la key (ej. `prodemix-production`) y copiá el valor **una sola vez**.
4. En tu app (local `.env` y en el host, ej. Railway):

   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

   Nunca commitees la key; va solo en variables de entorno.

## 2. Remitente (`EMAIL_FROM`)

Resend solo envía desde direcciones que cumplan sus reglas:

| Etapa | Qué usar |
|--------|-----------|
| **Pruebas rápidas** | `EMAIL_FROM="ProdeMix <onboarding@resend.dev>"` — no requiere dominio propio (límites de prueba de Resend). |
| **Producción** | Dominio verificado + dirección en ese dominio, ej. `ProdeMix <noreply@tudominio.com>`. |

Formato recomendado: `Nombre visible <email@dominio.com>` (con comillas en `.env` si hay espacios).

```bash
EMAIL_FROM="ProdeMix <noreply@tudominio.com>"
```

## 3. Verificar tu dominio (producción)

1. En Resend: **Domains** → **Add Domain** → ingresá `tudominio.com` (o subdominio).
2. Resend te da registros **DNS** (DKIM, SPF, a veces MX para rebotes).
3. En tu proveedor de DNS (Cloudflare, Namecheap, etc.) añadí esos registros **exactamente** como indica Resend.
4. Esperá a que el estado pase a **Verified** (puede tardar minutos u horas según DNS).

Sin dominio verificado no podés usar direcciones `@tudominio.com` como remitente (solo pruebas con `@resend.dev` según política actual de Resend).

## 4. Variables en ProdeMix

Mínimo para que el código use Resend:

| Variable | Descripción |
|----------|-------------|
| `RESEND_API_KEY` | API key de Resend. |
| `EMAIL_FROM` | Remitente permitido (ver arriba). |

## 5. Dónde configurarlas

- **Local:** `.env` (copiá desde `.env.example`).
- **Railway / Vercel / etc.:** panel de **Variables** del servicio → añadí `RESEND_API_KEY` y `EMAIL_FROM` → redeploy.

## 6. Comprobar que funciona

1. `RESEND_API_KEY` y `EMAIL_FROM` seteados.
2. Dispará un flujo que envíe mail (ej. cron de recordatorios si tenés `CRON_SECRET` y datos de prueba), o revisá logs del servidor al enviar.
3. En Resend: **Emails** → deberías ver envíos o errores con detalle.

## 7. Límites y facturación

Revisá el plan gratuito y límites en [resend.com/pricing](https://resend.com/pricing). Para producción con volumen, considerá plan de pago.

---

Más contexto del código: [email.md](./email.md) y [deployment.md](./deployment.md).
