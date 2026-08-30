# Decisiones

## Índice

- [TP1 - Git colaborativo](#tp1---git-colaborativo)
- [TP2 - Contenedores: la app del semestre](#tp2--contenedores-la-app-del-semestre)
- [TP3 - Planificación y trazabilidad](#tp3--planificación-y-trazabilidad)
- [TP4 - CI: Pipelines as Code](#tp4---ci-pipelines-as-code)


## TP1 - Git colaborativo

### Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.
Git no pudo resolver el conflicto automáticamente porque se había modificado exactamente la misma línea desde dos ramas distintas. Al mergear la primera rama a main y luego intentar mergear la segunda, Git encontró dos versiones diferentes para una misma línea y no pudo determinar cuál debía conservar.

Como Git no tiene criterio para decidir cuál de las dos versiones es la correcta, muestra ambas posibilidades y obliga al desarrollador a elegir una de ellas o realizar una combinación de las dos. De esta manera, la decisión sobre el contenido final queda en manos de una persona.

Para evitar este tipo de conflictos, es importante la comunicación y coordinación dentro del equipo para intentar no trabajar simultáneamente sobre la misma parte del código. De todas formas, los conflictos no siempre pueden evitarse y, cuando ocurren, deben resolverse analizando qué versión debe quedar.

### Qué problemas encontraste y cómo los solucionaste. Los tropiezos bien contados valen más que un camino perfecto:son los que demuestran que entendiste.

Al principio tuve una confusión porque no entendía dónde debía cambiar el nombre al crear una rama. Confundí el campo del nombre con un comentario y, como consecuencia, GitHub creó la rama con un nombre generado automáticamente. Luego entendí dónde debía escribir el nombre de la rama y, al volver a realizar el procedimiento, pude crearla correctamente siguiendo la convención feature/<descripcion>.

### Declaración de uso de IA: qué partes hiciste con ayuda de inteligencia artificial y cómo verificaste lo que te devolvió (§ Uso de IA del enunciado).

Utilicé ChatGPT como apoyo durante la realización del TP, principalmente para comprender conceptos como la protección de la rama main, el uso de ramas y Pull Requests, la resolución de conflictos, tags, releases y versionado semántico. También lo utilicé como guía para la instalación y configuración de Git/GitHub CLI y para comprender y ejecutar algunos comandos de Git.

No tomé las respuestas de la IA como resultado final sin verificarlas. Fui ejecutando los comandos en mi repositorio y comprobando sus efectos mediante git status, git log, GitHub y las distintas evidencias solicitadas en el TP. Cuando surgieron dudas o los resultados no coincidían con lo esperado, revisé el procedimiento antes de continuar.

La IA también me ayudó a comprender el propósito de cada paso para poder realizar el trabajo y explicarlo, en lugar de limitarme a copiar y ejecutar comandos.

Tambien utilicé IA para ayudarme a redactar todo lo relacionado con la documentación, siempre primero lo escribo yo con mis palabras y luego se lo envio para obtener una versión limpia.

## TP2 — Contenedores: la app del semestre

### Aplicación elegida

La aplicación elegida para trabajar durante el semestre es **ListaFácil**, una app web para gestionar compras compartidas dentro de un hogar.

Permite:
- registrarse e iniciar sesión;
- crear o unirse a un hogar;
- administrar un catálogo de productos;
- gestionar una lista de compras;
- asignar responsables y realizar compras.

### Tecnologías

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma

### ¿Por qué la elegí?

Elegí ListaFácil porque cumple con los requisitos de tener frontend, backend y base de datos, y además tiene suficiente lógica de negocio para poder aplicar sobre ella los próximos trabajos prácticos del semestre.

También me interesa porque es una aplicación que puedo seguir mejorando y ampliando a medida que avance la materia.

ListaFacil es una aplicación desarrollada previamente y cuenta con un historial propio de commits que refleja su evolución, incluyendo la configuración inicial, autenticación, gestión de hogares y miembros, catálogo, lista de compras y frontend.

Se decidió utilizar el repositorio propio de ListaFacil como repositorio principal del semestre, en lugar de incorporar la aplicación al repositorio utilizado originalmente para el TP1. De esta manera se conserva el historial real de desarrollo de la aplicación y se permite continuar evolucionándola incluso después de finalizar la materia.

Como parte de esta decisión, se migraron al repositorio de ListaFacil los archivos `decisiones.md` y `evidencias.md` provenientes del TP1 y se recrearán las protecciones de la rama `main`.

### Decisiones de contenerización

Para contenerizar ListaFácil se decidió separar la aplicación en tres servicios: **frontend, backend y base de datos**, cada uno ejecutándose en su propio contenedor y coordinados mediante Docker Compose.

Tanto el backend como el frontend utilizan **Dockerfiles multi-stage**. La idea es separar la etapa de construcción de la etapa de ejecución, evitando llevar a la imagen final herramientas que solamente son necesarias para compilar la aplicación.

En el **backend**, la primera etapa utiliza `node:24-bookworm-slim` para instalar las dependencias, generar Prisma Client y compilar el código TypeScript. La imagen final contiene solamente lo necesario para ejecutar el backend y aplicar las migraciones de Prisma.

En el **frontend**, la primera etapa utiliza `node:24-alpine` para instalar las dependencias y generar el build de React con Vite. Luego se utiliza `nginx:alpine` como imagen final, ya que una vez compilado el frontend solamente es necesario servir los archivos estáticos. Además, nginx funciona como proxy de las solicitudes `/api` hacia el backend.

Para la base de datos se utiliza `postgres:16-alpine`. PostgreSQL es el único servicio cuyos datos necesitan persistir aunque su contenedor sea eliminado, por lo que se configuró un **volumen nombrado `db_data`**. De esta manera, `docker compose down` puede eliminar y recrear los contenedores sin perder los datos almacenados. En cambio, al ejecutar `docker compose down -v` también se elimina el volumen y, por lo tanto, los datos.

Los contenedores de frontend y backend **no necesitan persistir información propia**. Si se eliminan, pueden volver a crearse a partir de sus imágenes. Esto permite tratar a los contenedores como elementos reemplazables, dejando la información que sí debe sobrevivir almacenada en el volumen de PostgreSQL.

Docker Compose permite levantar y conectar los tres servicios como un único sistema. Los servicios se comunican mediante la red interna de Compose utilizando sus nombres. Por ejemplo, el backend se conecta a PostgreSQL mediante `db` en lugar de utilizar `localhost`.

También se configuró un `healthcheck` para PostgreSQL junto con `depends_on` en el backend. Esto permite que el backend espere a que la base de datos esté realmente lista para aceptar conexiones, y no solamente a que su contenedor haya arrancado.

La configuración sensible se mantiene fuera de las imágenes. La contraseña de PostgreSQL y el secreto utilizado para JWT se proporcionan mediante variables de entorno definidas en un archivo `.env`, que está ignorado por Git. En el repositorio solamente se incluye `.env.example` como plantilla. De esta manera, una misma imagen puede utilizarse con distintas configuraciones sin tener que reconstruirla ni incluir secretos dentro del código o de la imagen.

### Problemas encontrados y cómo los resolví

#### Migraciones de Prisma en una base de datos nueva

Uno de los problemas apareció al incorporar PostgreSQL a Docker Compose. El contenedor de PostgreSQL crea la base de datos `listafacil`, pero inicialmente esa base está vacía y no contiene las tablas que necesita la aplicación.

Como las migraciones de Prisma ya están versionadas en el proyecto, decidimos aprovecharlas para preparar automáticamente la base de datos cada vez que el backend arranca en un entorno nuevo. Para esto configuramos el contenedor del backend para ejecutar primero:

`prisma migrate deploy`

y, solamente si las migraciones se aplican correctamente, iniciar la aplicación con:

`node dist/app.js`

De esta manera, al levantar ListaFácil desde cero, Prisma detecta las migraciones pendientes y crea o actualiza el esquema de la base de datos antes de que comience a funcionar el backend. Esto permite que una persona pueda levantar el sistema con Docker Compose sin tener que crear las tablas manualmente.

#### Prisma CLI en la imagen final del backend

La solución anterior generó un segundo problema. Para ejecutar `prisma migrate deploy`, la imagen final del backend necesita tener disponible Prisma CLI. Sin embargo, `prisma` estaba originalmente dentro de las `devDependencies`, porque hasta ese momento se utilizaba principalmente como una herramienta de desarrollo.

En una primera solución instalamos todas las dependencias, incluidas las de desarrollo, en la etapa final del Dockerfile. Esto funcionaba, pero hacía que la imagen final incluyera herramientas que no necesitábamos para ejecutar la aplicación, como TypeScript, `tsx` y distintos paquetes de tipos. Eso iba en contra del objetivo que buscábamos con el Dockerfile multi-stage: dejar en la imagen final solamente lo necesario para ejecutar la aplicación.

Por eso decidimos mover `prisma` de `devDependencies` a `dependencies`. De esta forma pudimos volver a utilizar:

`npm ci --omit=dev`

en la etapa final. Así, Prisma CLI sigue estando disponible para ejecutar las migraciones, pero el resto de las herramientas utilizadas únicamente durante el desarrollo y la compilación quedan fuera de la imagen final.

La solución final mantiene entonces las dos cosas que necesitábamos: **las migraciones se aplican automáticamente al arrancar el backend y la imagen final no necesita incluir todas las dependencias de desarrollo**.

## TP3 — Planificación y trazabilidad

### Duración del sprint

Elegí una duración de 2 semanas porque es un período suficientemente corto para revisar el avance y realizar ajustes con frecuencia, pero a la vez brinda tiempo suficiente para completar las tareas planificadas sin generar una sobrecarga de planificación.
- ¿Por qué no 1 semana? Podría ser demasiado corto: estaría planificando y revisando muy seguido en relación con el poco trabajo disponible.
- ¿Por qué no 1 mes? Es demasiado largo para este contexto: si algo se desvía, tardaría mucho en detectarlo y reajustar la planificación.

Por eso 2 semanas es un punto intermedio razonable: trabajás, evaluás qué se completó y cada dos semanas tenés oportunidad de reorganizar lo siguiente.

### Limite WIP (Work In Progress)

Elegí un límite de 2 elementos en In Progress, siguiendo la regla de cantidad de personas del equipo + 1. Como trabajo de forma individual, el límite es 1 + 1 = 2. El elemento adicional funciona como buffer si una tarea queda esperando una revisión o respuesta, permitiéndome avanzar con otra sin acumular demasiado trabajo en paralelo.

### Diagnóstico de la historia mal escrita

#### “Como desarrollador quiero crear la tabla usuarios para guardar los datos.”
¿Por qué está mal escrita? Está formulada como una solución o tarea técnica (“crear la tabla usuarios”) en lugar de expresar una necesidad que aporte valor al usuario.
Cómo la reescribiría: 
#### “Como usuario quiero registrarme en la aplicación para poder acceder a mis datos y funcionalidades.”

### Problemas encontrados

Al configurar el Project tuve dificultad para encontrar la opción para crear el campo Sprint, ya que inicialmente confundí el botón global + de GitHub con el botón para agregar campos de la tabla. Lo resolví mandandole a la IA una captura de pantalla y que me indicara donde esta la opción de agregar un nuevo campo dentro de la vista Table y creando allí el campo de tipo Iteration.

### Declaracion de uso de IA

Utilicé ChatGPT como asistencia para interpretar la guía del TP, comprender los conceptos y acompañar paso a paso la configuración del Project, la jerarquía de issues, el sprint, el límite WIP y la trazabilidad con el Pull Request. Verifiqué las indicaciones contrastándolas con la guía de la cátedra y comprobando en GitHub que cada configuración y automatización funcionara como se esperaba.

## TP4 - CI: Pipelines as Code