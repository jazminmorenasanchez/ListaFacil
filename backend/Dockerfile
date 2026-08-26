# ---- Etapa 1: build ----
FROM node:24-bookworm-slim AS build

WORKDIR /app

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

# Instalamos solamente dependencias necesarias en producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiamos el código ya compilado desde la etapa build
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/app.js"]