# Producción: prodemix.app

Referencia única para variables, OAuth y URLs públicas del dominio **prodemix.app**.

**Origen público (sin barra final):** `https://prodemix.app`

---

## 0. Nunca configuraste Google: guía desde cero

Hacé esto **una vez**. Necesitás una cuenta de Google (Gmail).

### A. Entrar a Google Cloud

1. Abrí: **https://console.cloud.google.com/**
2. Si te pide, aceptá los términos.
3. Arriba, al lado del logo de Google Cloud, hacé clic en el **nombre del proyecto** (a veces dice “Seleccionar proyecto”).
4. Clic en **Nuevo proyecto** → nombre ej. `ProdeMix` → **Crear**. Esperá unos segundos y **seleccioná** ese proyecto (debe quedar marcado arriba).

### B. Pantalla de consentimiento OAuth (obligatoria antes de las credenciales)

1. Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth**.
2. Tipo de usuario: **Externo** (para usuarios con cuenta Google) → **Crear**.
3. Completá lo mínimo:
   - **Nombre de la aplicación:** `ProdeMix` (o el que quieras).
   - **Correo de asistencia del usuario:** tu email.
   - **Dominios autorizados** (producción): agregá `prodemix.app` (sin `https://`).
   - **Correo del desarrollador:** tu email.
4. **Guardar y continuar** en los pasos siguientes (Alcances: podés dejar por defecto / no agregar scopes extra; Usuarios de prueba: si la app queda en “Prueba”, agregá **tu email de Gmail** como usuario de prueba para poder loguearte).
5. **Volver al panel** o al menú de APIs.

### C. Crear el cliente OAuth (ID + secreto que usa ProdeMix)

1. Menú ☰ → **APIs y servicios** → **Credenciales**.
2. **+ Crear credenciales** → **ID de cliente de OAuth**.
3. Tipo de aplicación: **Aplicación web**.
4. **Nombre:** ej. `ProdeMix web`.
5. **Orígenes autorizados de JavaScript** → **Agregar URI** y pegá **una por vez**:
   - `https://prodemix.app`
   - `http://localhost:3000`
6. **URI de redireccionamiento autorizados** → **Agregar URI**:
   - `https://prodemix.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
7. **Crear**.
8. Te aparece un cuadro con:
   - **ID de cliente** → eso va en `GOOGLE_CLIENT_ID`
   - **Secreto del cliente** → eso va en `GOOGLE_CLIENT_SECRET` (copialo y guardalo; si lo perdés, podés “restablecer” el secreto en Google).

### D. Poner los valores en tu app

- En **Vercel** (o tu hosting): **Settings → Environment Variables** y cargá `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL=https://prodemix.app`, `AUTH_SECRET`, etc.
- En tu PC, en el archivo **`.env`** (local, no se sube a Git):

  ```env
  AUTH_URL=http://localhost:3000
  GOOGLE_CLIENT_ID=el-id-que-copiaste
  GOOGLE_CLIENT_SECRET=el-secreto-que-copiaste
  ```

Redeploy en producción después de cambiar variables.

### Si algo falla

- **redirect_uri_mismatch**: las URLs en Google tienen que ser **exactamente** las de la sección C (mismo `http`/`https`, misma ruta).
- **Access blocked / app en prueba**: agregá tu Gmail en **Usuarios de prueba** (Pantalla de consentimiento) o publicá la verificación de la app (más largo; para empezar alcanza con usuarios de prueba).

---

## 1. Variables de entorno (producción)

Configurar en Vercel / Railway / el host que uses (no commitear valores reales).

| Variable | Valor / notas |
|----------|----------------|
| `AUTH_URL` | `https://prodemix.app` |
| `AUTH_SECRET` | `openssl rand -base64 32` (único por entorno; distinto de staging) |
| `DATABASE_URL` | URL Postgres (Neon: pooled, host con `-pooler`; `?sslmode=require`) |
| `DIRECT_URL` | Opcional Neon: misma base, host **sin** `-pooler` (solo migraciones) |
| `GOOGLE_CLIENT_ID` | Client ID del OAuth Web (Google Cloud) |
| `GOOGLE_CLIENT_SECRET` | Client secret del mismo cliente OAuth |
| `EMAIL_FROM` | Ej.: `ProdeMix <noreply@prodemix.app>` (tras verificar dominio en Resend) |
| `RESEND_API_KEY` | Si usás Resend para mail |
| `CRON_SECRET` | Secreto largo para `GET /api/cron/reminders` |
| `ADMIN_SECRET` | Si usás panel `/admin` |

Legacy opcional: `NEXTAUTH_URL=https://prodemix.app` (misma función que `AUTH_URL` en muchos casos).

---

## 2. Google Cloud Console (OAuth “Continuar con Google”)

1. [Google Cloud Console](https://console.cloud.google.com/) → tu proyecto → **APIs y servicios** → **Credenciales**.
2. **Crear credenciales** → **ID de cliente de OAuth** → tipo **Aplicación web**.
3. **Orígenes autorizados de JavaScript** (uno por línea):

   ```
   https://prodemix.app
   http://localhost:3000
   ```

   Si usás `www` como entrada principal, agregá también:

   ```
   https://www.prodemix.app
   ```

4. **URI de redireccionamiento autorizados** (exactos, incluido `https` y la ruta completa):

   ```
   https://prodemix.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

   Si tenés `www` en el mismo cliente:

   ```
   https://www.prodemix.app/api/auth/callback/google
   ```

5. Copiar **ID de cliente** → `GOOGLE_CLIENT_ID` y **Secreto del cliente** → `GOOGLE_CLIENT_SECRET` en el hosting.
6. En producción, `AUTH_URL` debe ser exactamente el mismo origen que usaste en **JavaScript origins** para la app principal (normalmente `https://prodemix.app`).

Pantalla de consentimiento OAuth: nombre de la app, dominio autorizado, email de soporte (puede ser `hola@prodemix.app` o el que uses).

---

## 3. URLs útiles (producción)

| Uso | URL |
|-----|-----|
| Sitio | `https://prodemix.app` |
| Login | `https://prodemix.app/login` |
| Callback Google (Auth.js) | `https://prodemix.app/api/auth/callback/google` |
| API Auth (catch-all) | `https://prodemix.app/api/auth/*` |

---

## 4. Desarrollo local (máquina)

| Uso | URL |
|-----|-----|
| App | `http://localhost:3000` |
| `AUTH_URL` en `.env` local | `http://localhost:3000` |
| Callback Google local | `http://localhost:3000/api/auth/callback/google` |

Las mismas URIs locales deben estar en el **mismo** cliente OAuth de Google que usás para probar (junto con `https://prodemix.app`).

---

## 5. DNS y dominio (Vercel u otro)

- Apuntá **prodemix.app** al hosting (A/CNAME según el proveedor).
- Forzá **HTTPS** (Vercel lo hace con certificado automático).
- Si redirigís `www` → apex (o al revés), mantené coherente los **origins** de Google OAuth con la URL que ve el usuario.

---

## 6. Checklist antes de publicar

- [ ] `AUTH_URL=https://prodemix.app` en producción.
- [ ] `AUTH_SECRET` definido y no reutilizado de staging.
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` y URIs de Google coinciden con la tabla de arriba.
- [ ] `DATABASE_URL` apunta a la base de **producción**.
- [ ] Probar **Iniciar sesión con Google** en `https://prodemix.app/login`.

Más detalle de variables: [environment.md](./environment.md). Despliegue general: [deployment.md](./deployment.md).
