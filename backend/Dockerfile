# ---- Etapa 1: build ----
FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Primero copiamos los archivos de dependencias para aprovechar la caché
COPY package.json package-lock.json ./
RUN npm ci

# Copiamos la configuración y schema de Prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copiamos TypeScript y el código fuente
COPY tsconfig.json ./
COPY src ./src

# Generamos Prisma Client y compilamos TypeScript
RUN npx prisma generate
RUN npm run build


# ---- Etapa 2: runtime ----
FROM node:24-bookworm-slim AS final

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# El CLI de Prisma es necesario para aplicar migraciones al iniciar.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiamos el código compilado, la configuración y las migraciones.
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/app.js"]
