# Fuentes de datos (mock vs servidor)

Referencia rápida para saber qué lee la app desde **Postgres (Neon)** y qué sigue en **cliente / mocks**.

| Área | Origen principal | Notas |
|------|------------------|--------|
| **Auth** (sesión, email, username, imagen) | Postgres `User` vía Auth.js + `session` callback | `username` obligatorio tras onboarding. |
| **Catálogo torneos / partidos (API)** | `GET /api/catalog/tournaments` → Postgres | Seed: `npm run db:seed` o `db:seed:if-empty` en primer deploy. |
| **Pronósticos en pools públicos** | `localStorage` por usuario (`predictionMap`, `publicPoolPredictionMap`) | Vinculado al `userId` de la sesión; no es multi-dispositivo por defecto. |
| **Prodes “Mis prodes” (lista servidor)** | `GET /api/me/prodes` cuando la sesión está lista | Ver `MisProdesServerSection` vs mock local. |
| **Torneos UI (browse)** | Aún mezcla mocks (`getTorneoBrowseItems`, catálogo) + datos de API en transición | Ir cerrando hacia API + estado local solo para UX. |
| **Ranking / actividad** | Parte API (`/api/ranking`, etc.), parte mocks | Revisar cada pantalla antes de asumir “live”. |
| **Admin / resultados** | API + almacenamiento admin en `localStorage` (panel) | No confundir con datos de producción de usuarios finales. |

**Regla práctica:** si guardás algo sensible o competitivo (pronósticos oficiales del prode), preferí **API + DB**; el estado en disco del navegador es para MVP y UX offline-first parcial.
