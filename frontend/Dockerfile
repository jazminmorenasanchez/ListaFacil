# ---- Etapa 1: build ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_SENTRY_DSN=""
RUN VITE_SENTRY_DSN="$VITE_SENTRY_DSN" npm run build


# ---- Etapa 2: tests con coverage ----
FROM build AS test
CMD ["npm", "run", "test:ci"]

# ---- Etapa 3: nginx sirve los estáticos ----
FROM nginx:alpine

ENV BACKEND_URL=http://backend:3000 \
    DNS_RESOLVER=127.0.0.11 \
    PORT=80 \
    NGINX_ENVSUBST_FILTER="^(BACKEND_URL|DNS_RESOLVER|PORT)$"

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
