# ListaFácil

Base del monorepositorio de ListaFácil. En esta etapa contiene un frontend mínimo con React y Vite, y un backend mínimo con Express.

## Requisitos

- Node.js 20.19 o superior
- npm

## Frontend

Durante el desarrollo, el frontend envía las solicitudes relativas bajo `/api` al backend local mediante el proxy configurado en Vite.

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará en la terminal la URL local del frontend.

Para compilarlo:

```bash
cd frontend
npm run build
```

## Backend

```bash
cd backend
npm install
npm run dev
```

El servidor utiliza el puerto indicado por `PORT` y, si no está definido, escucha en `3000`. El endpoint de comprobación está disponible en `GET /health`.

Para compilarlo y ejecutar la versión compilada:

```bash
cd backend
npm run build
npm start
```

En PowerShell se puede elegir otro puerto antes de iniciar el backend con `$env:PORT=4000`.

## Docker

La configuración de Docker se agregará en una etapa posterior.
