# ListaFácil

Base del monorepositorio de ListaFácil. En esta etapa contiene un frontend mínimo con React y Vite, y un backend mínimo con Express.

## Requisitos

- Node.js 20.19 o superior
- npm

## Frontend

Copiar `frontend/.env.example` como `frontend/.env` si se necesita cambiar la URL del backend. La variable disponible es `VITE_API_URL` y su valor predeterminado de desarrollo es `http://localhost:3000`.

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
