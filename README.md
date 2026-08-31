# ListaFácil - version A

ListaFácil es una aplicación web para gestionar de forma colaborativa las compras de un hogar.

La aplicación está compuesta por:

- **Frontend:** React + Vite.
- **Backend:** Node.js + Express.
- **Base de datos:** PostgreSQL.
- **ORM:** Prisma.
- **Servidor web del frontend:** nginx.
- **Contenedores:** Docker y Docker Compose.

[![CI](https://github.com/jazminmorenasanchez/ListaFacil/actions/workflows/ci.yml/badge.svg)](https://github.com/jazminmorenasanchez/ListaFacil/actions/workflows/ci.yml)

## Índice

- [Requisitos](#requisitos)
- [Arranque desde cero con Docker Compose](#arranque-desde-cero-con-docker-compose)
- [Detener la aplicación](#detener-la-aplicación)
- [Ejecución utilizando imágenes publicadas](#ejecución-utilizando-imágenes-publicadas)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [Persistencia de datos](#persistencia-de-datos)
- [Puertos](#puertos)

## Requisitos

Para ejecutar la aplicación mediante contenedores solo es necesario tener instalado:

- Docker
- Docker Compose

No es necesario instalar Node.js, npm ni PostgreSQL en la máquina host para ejecutar el sistema mediante Docker.

---

## Arranque desde cero con Docker Compose

Después de clonar el repositorio, ubicarse en la raíz del proyecto.

### 1. Crear el archivo de variables de entorno

El repositorio contiene `.env.example` como plantilla, pero el archivo `.env` real no se versiona porque contiene secretos.

En Linux/macOS:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Luego editar `.env` y reemplazar los valores de ejemplo de:

```env
DB_PASSWORD="..."
JWT_SECRET="..."
```

por valores locales reales.

### 2. Levantar el sistema completo

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Docker Compose construye y levanta los tres servicios:

- `db`: PostgreSQL.
- `backend`: API de ListaFácil.
- `frontend`: aplicación React servida mediante nginx.

El backend espera a que PostgreSQL esté saludable antes de iniciar y aplica las migraciones de Prisma necesarias sobre la base de datos.

### 3. Verificar los servicios

```bash
docker compose ps
```

La base de datos debe aparecer como `healthy` y los servicios `backend` y `frontend` deben estar ejecutándose.

Para comprobar el backend:

```bash
curl http://localhost:8080/health
```

La respuesta esperada es:

```json
{"status":"ok"}
```

### 4. Abrir la aplicación

La aplicación está disponible en:

```text
http://localhost:3000
```

El frontend realiza sus solicitudes mediante `/api`. nginx reenvía esas solicitudes al servicio `backend` dentro de la red interna creada por Docker Compose.

---

## Detener la aplicación

Para detener y eliminar los contenedores y la red:

```bash
docker compose down
```

El volumen de PostgreSQL se conserva, por lo que los datos permanecen disponibles para el próximo arranque.

Para eliminar también el volumen y, por lo tanto, los datos almacenados:

```bash
docker compose down -v
```

> `docker compose down -v` elimina los datos persistidos de PostgreSQL. Utilizarlo únicamente cuando se quiera reiniciar la base desde cero.

---

## Ejecución utilizando imágenes publicadas

Las imágenes de ListaFácil también están publicadas en GitHub Container Registry (GHCR).

Para levantar el sistema utilizando las imágenes ya construidas, en lugar de construirlas desde el código fuente:

```bash
docker compose -f docker-compose.registry.yml up -d
```

Esta variante descarga y utiliza:

```text
ghcr.io/jazminmorenasanchez/listafacil-backend:v0.1.0
ghcr.io/jazminmorenasanchez/listafacil-frontend:v0.1.0
```

También requiere un archivo `.env` con `DB_PASSWORD` y `JWT_SECRET`.

Para detener esta variante:

```bash
docker compose -f docker-compose.registry.yml down
```
### Compatibilidad de arquitectura

Las imágenes `v0.1.0` publicadas en GHCR fueron construidas en una PC con procesador Intel x64, por lo que actualmente están destinadas a la arquitectura `linux/amd64`.

Por el momento, las imágenes no son multi-arquitectura. Una máquina con una arquitectura diferente, por ejemplo ARM64, podría no poder ejecutarlas.

La publicación de imágenes multi-arquitectura mediante Docker Buildx se abordará en una etapa posterior del proyecto.

---

## Desarrollo local sin Docker

También es posible ejecutar frontend y backend directamente durante el desarrollo.

### Backend

```bash
cd backend
npm install
npm run dev
```

Por defecto, el backend escucha en el puerto `3000`.

El endpoint de salud es:

```text
GET /health
```

Para ejecutar el backend localmente es necesario proporcionar las variables de entorno requeridas, incluyendo `DATABASE_URL` y `JWT_SECRET`.

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Durante el desarrollo, Vite reenvía las solicitudes realizadas a `/api` hacia el backend local.

---

## Persistencia de datos

PostgreSQL utiliza un volumen nombrado de Docker:

```text
db_data
```

Docker Compose crea el volumen asociado al proyecto y lo monta en el directorio de datos de PostgreSQL.

Por este motivo:

```text
docker compose down
```

elimina los contenedores pero conserva los datos, mientras que:

```text
docker compose down -v
```

elimina también el volumen y sus datos.

---

## Puertos

| Servicio | Acceso desde la máquina host |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8080` |
| PostgreSQL | No se publica al host |

Los servicios se comunican internamente utilizando los nombres definidos en Docker Compose. Por ejemplo, el backend se conecta a PostgreSQL mediante el hostname `db`.
