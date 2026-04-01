# Imagen oficial Node 22 (Debian). Prisma 7 requiere 20.19+, 22.12+ o 24+.
FROM node:22-bookworm-slim

WORKDIR /app

COPY . .

# Algunos hosts inyectan NODE_ENV=production y npm ci omitiría devDependencies (rompe el build de Next).
ENV NODE_ENV=development
RUN npm ci

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
