# Imagen oficial Node 22 (Debian). Prisma 7 requiere 20.19+, 22.12+ o 24+.
FROM node:22-bookworm-slim

WORKDIR /app

COPY . .

# npm ci necesita devDependencies (TypeScript, Tailwind, etc.)
ENV NODE_ENV=development
RUN npm ci

# next build debe correr con NODE_ENV=production (recomendación de Next).
# No hay Postgres en la imagen durante el build: URL ficticia solo para que Prisma/imports no fallen.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" npm run build

ENV PORT=3000

EXPOSE 3000

# En runtime Railway inyecta DATABASE_URL real (Neon).
CMD ["npm", "run", "start:prod"]
