# Seguridad operativa (ProdeMix)

## Cookies y sesión (Auth.js)

- Las cookies de sesión usan **`httpOnly`**, **`SameSite=Lax`** (por defecto en Auth.js) y **`Secure` en producción** vía `useSecureCookies`.
- La sesión en base de datos expira a los **30 días**; se refresca al usar la app (`updateAge` 24 h).
- **CSRF**: Auth.js incluye token CSRF en flujos que modifican estado (p. ej. sign-in). No desactivar `trustHost` sin saber el impacto en tu hosting; el `Host` debe ser el de tu app.

## Admin

- `ADMIN_SECRET` solo en servidor; nunca en cliente.
- Cookie `prodemix_admin`: `httpOnly`, `SameSite=Lax`, `Secure` en producción.
- Login admin: comparación **en tiempo constante** del secreto; **rate limit** por IP (`src/proxy.ts` + ruta).
- APIs `/api/admin/*`: `proxy` + `requireAdminApi()` en cada handler.

## Rate limiting

Implementación en memoria por instancia (útil contra ráfagas; en varias réplicas cada una tiene su contador).

| Área | Límite orientativo |
|------|---------------------|
| `/api/auth/*` | 60 req / min / IP |
| `POST` …/predictions | 120 req / min / IP (`proxy`) + 90 / min / usuario+IP (ruta) |
| `POST` /api/admin/login | 15 / min / IP |

Respuesta **429** con cabecera `Retry-After` cuando aplica.

## Validación

- Cuerpos JSON sensibles pasan por **Zod** donde está integrado (p. ej. perfil, login admin).
- El resto de APIs admin ya usan esquemas en `src/lib/validation/`.

## Variables de entorno

- No exponer secretos con prefijo `NEXT_PUBLIC_`.
- Revisar `instrumentation.ts` en producción (avisos si faltan `AUTH_SECRET` / `DATABASE_URL`).
