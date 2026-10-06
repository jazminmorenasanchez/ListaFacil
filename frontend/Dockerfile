# ---- Etapa 1: build ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---- Etapa 2: tests con coverage ----
FROM build AS test
CMD ["npm", "run", "test:ci"]

# ---- Etapa 3: nginx sirve los estáticos ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
