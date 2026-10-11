# Decisiones

## Índice

- [TP1 - Git colaborativo](#tp1---git-colaborativo)
- [TP2 - Contenedores: la app del semestre](#tp2--contenedores-la-app-del-semestre)
- [TP3 - Planificación y trazabilidad](#tp3--planificación-y-trazabilidad)
- [TP4 - CI: Pipelines as Code](#tp4---ci-pipelines-as-code)
- [TP5 - Tests y cobertura como requisito de merge](#tp5---tests-y-cobertura-como-requisito-de-merge)


## TP1 - Git colaborativo

### Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.
Git no pudo resolver el conflicto automáticamente porque se había modificado exactamente la misma línea desde dos ramas distintas. Al mergear la primera rama a main y luego intentar mergear la segunda, Git encontró dos versiones diferentes para una misma línea y no pudo determinar cuál debía conservar.

Como Git no tiene criterio para decidir cuál de las dos versiones es la correcta, muestra ambas posibilidades y obliga al desarrollador a elegir una de ellas o realizar una combinación de las dos. De esta manera, la decisión sobre el contenido final queda en manos de una persona.

Para que el conflicto no apareciera, las dos ramas podrían haber modificado partes diferentes del archivo, en cuyo caso Git habría podido combinar los cambios automáticamente. También podría haberse evitado si, antes de modificar esa misma línea, una de las ramas hubiera incorporado los cambios realizados por la otra y trabajado a partir de esa versión actualizada. De todas formas, los conflictos no siempre pueden evitarse y, cuando ocurren, deben resolverse analizando qué contenido debe quedar en la versión final.

### Qué problemas encontraste y cómo los solucionaste. Los tropiezos bien contados valen más que un camino perfecto:son los que demuestran que entendiste.

Al principio tuve una confusión porque no entendía dónde debía cambiar el nombre al crear una rama. Confundí el campo del nombre con un comentario y, como consecuencia, GitHub creó la rama con un nombre generado automáticamente. Luego entendí dónde debía escribir el nombre de la rama y, al volver a realizar el procedimiento, pude crearla correctamente siguiendo la convención feature/<descripcion>.

### Declaración de uso de IA: qué partes hiciste con ayuda de inteligencia artificial y cómo verificaste lo que te devolvió.

Utilicé ChatGPT como apoyo durante la realización del TP, principalmente para comprender conceptos como la protección de la rama main, el uso de ramas y Pull Requests, la resolución de conflictos, tags, releases y versionado semántico. También lo utilicé como guía para la instalación y configuración de Git/GitHub CLI y para comprender y ejecutar algunos comandos de Git.

No tomé las respuestas de la IA como resultado final sin verificarlas. Fui ejecutando los comandos en mi repositorio y comprobando sus efectos mediante git status, git log, GitHub y las distintas evidencias solicitadas en el TP. Cuando surgieron dudas o los resultados no coincidían con lo esperado, revisé el procedimiento antes de continuar.

La IA también me ayudó a comprender el propósito de cada paso para poder realizar el trabajo y explicarlo, en lugar de limitarme a copiar y ejecutar comandos.

También utilicé IA para ayudarme a redactar todo lo relacionado con la documentación, siempre primero lo escribo yo con mis palabras y luego se lo envío para obtener una versión limpia.

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

ListaFácil es una aplicación desarrollada previamente y cuenta con un historial propio de commits que refleja su evolución, incluyendo la configuración inicial, autenticación, gestión de hogares y miembros, catálogo, lista de compras y frontend.

Se decidió utilizar el repositorio propio de ListaFacil como repositorio principal del semestre, en lugar de incorporar la aplicación al repositorio utilizado originalmente para el TP1. De esta manera se conserva el historial real de desarrollo de la aplicación y se permite continuar evolucionándola incluso después de finalizar la materia.

Como parte de esta decisión, se migraron al repositorio de ListaFacil los archivos `decisiones.md` y `evidencias.md` provenientes del TP1 y se recrearon las protecciones de la rama `main`, adaptando este repositorio al flujo de trabajo requerido en el TP1.

### Migración y reconstrucción de la trazabilidad del TP1

#### Contexto

El TP1 se realizó inicialmente en un repositorio independiente, siguiendo la consigna
original de crear un repositorio específico para el trabajo práctico.

Posteriormente, al comenzar el desarrollo de ListaFacil como aplicación integradora del
semestre, se tomó la decisión de centralizar en un único repositorio el trabajo de los
TP posteriores y la documentación asociada.

Por este motivo se realizó una migración de la documentación del TP1 a `ListaFacil`.

#### Problema detectado

La migración de archivos no implica la migración automática de los objetos y referencias
propias del repositorio Git anterior.

En particular, elementos como:

- tags;
- releases;
- Pull Requests;
- configuración de protección de ramas;
- evidencias de conflictos;

pertenecen al repositorio donde fueron creados y no se trasladan simplemente copiando
los archivos del proyecto.

Durante la preparación de la defensa se detectó que `ListaFacil` contenía la documentación
migrada del TP1, pero no toda la trazabilidad Git que se quería conservar dentro del
repositorio definitivo.

#### Decisión

En lugar de modificar o falsear el historial existente, se decidió reconstruir únicamente
las prácticas necesarias dentro de `ListaFacil`.

Se volvió a verificar:

- protección de `main`;
- trabajo mediante Pull Requests;
- generación y resolución deliberada de un conflicto;
- creación del tag y release correspondientes al TP1.

La intención no fue simular que estas operaciones ocurrieron en una fecha diferente,
sino garantizar que el repositorio definitivo contuviera evidencia verificable de los
conceptos evaluados en el TP1.

#### Decisión sobre el tag `v1.0.0`

Al momento de completar esta regularización ya existía el tag `v4.0.0`.

Crear `v1.0.0` sobre el estado actual de `main` hubiera sido técnicamente válido para Git,
pero conceptualmente incorrecto, porque habría hecho que una versión `1.0.0` apuntara a
un estado posterior a la versión `4.0.0`.

Por ese motivo se decidió crear el tag de manera retrospectiva sobre el commit histórico:

`8eaa96d3061136df8b92a1bed9d031616f226037`

correspondiente al merge de la migración del TP1 al repositorio del semestre.

De esta manera:

- `v1.0.0` referencia un punto anterior del historial;
- `v4.0.0` continúa representando una versión posterior;
- no se mueve ni modifica ningún tag existente;
- no se reescribe el historial;
- la numeración conserva su significado temporal dentro del proyecto.

La fecha de creación del objeto tag es posterior a la fecha del commit señalado, lo cual
es válido en Git: un tag puede crearse posteriormente apuntando a cualquier commit
existente del historial.

#### Resultado

El repositorio mantiene ahora una trazabilidad coherente:

`v1.0.0` → incorporación histórica del TP1 al repositorio del semestre

...

`v4.0.0` → cierre del TP4

La regularización se realizó preservando el historial existente en lugar de modificarlo
para aparentar una cronología que no ocurrió.

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

### Declaración de uso de IA

Utilicé ChatGPT como herramienta de apoyo durante el TP2 para interpretar el enunciado, adaptar la guía de Docker a la arquitectura de ListaFácil y comprender los problemas que fueron apareciendo durante la contenerización.

En particular, lo utilicé como apoyo para analizar la construcción multi-stage de los Dockerfiles, la configuración de Docker Compose, la comunicación entre servicios, los healthchecks, las variables de entorno y los problemas relacionados con Prisma y sus migraciones.

Las soluciones propuestas fueron verificadas ejecutando los builds y contenedores localmente, revisando su estado con Docker y comprobando que la aplicación funcionara correctamente antes de incorporarlas al repositorio.

## TP3 — Planificación y trazabilidad

### Duración del sprint

Elegí una duración de 2 semanas porque es un período suficientemente corto para revisar el avance y realizar ajustes con frecuencia, pero a la vez brinda tiempo suficiente para completar las tareas planificadas sin generar una sobrecarga de planificación.
- ¿Por qué no 1 semana? Podría ser demasiado corto: estaría planificando y revisando muy seguido en relación con el poco trabajo disponible.
- ¿Por qué no 1 mes? Es demasiado largo para este contexto: si algo se desvía, tardaría mucho en detectarlo y reajustar la planificación.

Por eso 2 semanas es un punto intermedio razonable: trabajás, evaluás qué se completó y cada dos semanas tenés oportunidad de reorganizar lo siguiente.

### Límite WIP (Work In Progress)

Elegí un límite de 2 elementos en In Progress, siguiendo la regla de cantidad de personas del equipo + 1. Como trabajo de forma individual, el límite es 1 + 1 = 2. El elemento adicional funciona como buffer si una tarea queda esperando una revisión o respuesta, permitiéndome avanzar con otra sin acumular demasiado trabajo en paralelo.

### Diagnóstico de la historia mal escrita

#### “Como desarrollador quiero crear la tabla usuarios para guardar los datos.”
¿Por qué está mal escrita? Está formulada como una solución o tarea técnica (“crear la tabla usuarios”) en lugar de expresar una necesidad que aporte valor al usuario.
Cómo la reescribiría: 
#### “Como usuario quiero registrarme en la aplicación para poder acceder a mis datos y funcionalidades.”

### Problemas encontrados

Al configurar el Project tuve dificultad para encontrar la opción para crear el campo Sprint, ya que inicialmente confundí el botón global + de GitHub con el botón para agregar campos de la tabla. Lo resolví enviándole a la IA una captura de pantalla para que me indicara dónde estaba la opción de agregar un nuevo campo dentro de la vista Table. Luego creé allí el campo de tipo Iteration.

### Declaración de uso de IA

Utilicé ChatGPT como asistencia para interpretar la guía del TP, comprender los conceptos y acompañar paso a paso la configuración del Project, la jerarquía de issues, el sprint, el límite WIP y la trazabilidad con el Pull Request. Verifiqué las indicaciones contrastándolas con la guía de la cátedra y comprobando en GitHub que cada configuración y automatización funcionara como se esperaba.

## TP4 - CI: Pipelines as Code

### Estructura del pipeline

El pipeline de integración continua se definió en `.github/workflows/ci.yml` utilizando GitHub Actions.

Se eligieron dos jobs independientes:

- `build-backend`
- `build-frontend`

La aplicación está separada en backend y frontend, y cada parte posee su propio Dockerfile. Por este motivo, cada imagen se construye en un job distinto.

Los jobs no dependen entre sí, por lo que pueden ejecutarse en paralelo. De esta manera, si uno de los builds falla, el otro puede continuar y mostrar de forma independiente qué parte de la aplicación presenta el problema.

El workflow se ejecuta en los Pull Requests dirigidos a `main` y también ante pushes a `main`. Los Pull Requests permiten verificar los cambios antes del merge, mientras que las ejecuciones sobre `main` mantienen actualizado el estado del pipeline y el badge del README.

### Cache de capas

Para acelerar construcciones posteriores se configuró cache de capas de Docker mediante GitHub Actions y Docker Buildx.

Cada job utiliza su propio scope:

- `scope=backend`
- `scope=frontend`

Esto evita que el cache de una imagen sobrescriba al de la otra.

El pipeline intenta recuperar las capas almacenadas con `cache-from` y, al terminar, guarda las capas mediante `cache-to` con `mode=max`.

Se reutilizan las capas cuyo contenido y dependencias no cambiaron. Por ejemplo, si no cambian los archivos de dependencias, pueden reutilizarse capas como la instalación realizada por `npm ci`. Cuando cambia una instrucción o alguno de los archivos de los que depende, esa capa y las posteriores deben reconstruirse.

Se verificó el funcionamiento del cache ejecutando dos veces el pipeline sobre el mismo Pull Request. En la segunda corrida se observaron capas marcadas como `CACHED` tanto en backend como en frontend.

El cache es solamente una optimización. Si desaparece, el pipeline debe continuar funcionando y reconstruir las imágenes desde cero; únicamente tardaría más.

### Uso de los Dockerfiles del proyecto

El pipeline construye el backend y el frontend utilizando los Dockerfiles creados previamente para la aplicación.

Se decidió no repetir en GitHub Actions comandos específicos como `npm ci`, `npm run build` o la generación de Prisma Client.

De esta manera existe una única definición de cómo se construye cada componente: su Dockerfile.

Esto evita mantener dos procesos de build diferentes que podrían divergir con el tiempo. El mismo proceso que se utiliza para construir las imágenes de la aplicación es el que verifica el pipeline de integración continua.

### Pipeline como requisito de merge

Se configuraron `build-backend` y `build-frontend` como status checks obligatorios para realizar merge sobre `main`.

También se activó la opción que exige que la rama se encuentre actualizada con `main` antes del merge.

Se comprobó el funcionamiento del gate introduciendo intencionalmente un import inexistente en el backend. El build de TypeScript falló durante la construcción de la imagen y el check `build-backend` quedó en rojo, bloqueando el botón de merge.

Luego se eliminó el error, se realizó un nuevo push sobre el mismo Pull Request y el pipeline volvió a ejecutarse automáticamente. Cuando ambos jobs quedaron verdes, el Pull Request volvió a quedar habilitado para merge.

También se comprobó el requisito de mantener la rama actualizada mediante un segundo Pull Request. Luego de modificar `main`, GitHub indicó que la rama estaba desactualizada y exigió utilizar `Update branch` antes de permitir el merge.

### Problemas encontrados

Durante la implementación del TP4 no surgieron problemas técnicos relevantes que requirieran una solución adicional. La configuración del workflow, los jobs, el cache y los status checks se pudo realizar y verificar según lo previsto.


### Uso de inteligencia artificial

Se utilizó inteligencia artificial como herramienta de apoyo durante el desarrollo del trabajo práctico.

Su uso estuvo orientado principalmente a interpretar el enunciado, adaptar los ejemplos de la guía a la estructura y tecnologías de ListaFácil, comprender los comandos utilizados, analizar errores y revisar la configuración realizada.

Las decisiones y cambios fueron verificados durante la implementación mediante builds locales, ejecuciones de GitHub Actions y comprobaciones en los Pull Requests.

## TP5 - Calidad automatizada: tests y cobertura

### 1. Lógica elegida para los tests

Para este trabajo práctico incorporé tests automáticos al backend y al frontend de ListaFácil. Elegí probar principalmente las reglas relacionadas con los productos, las compras y los permisos, porque son funcionalidades donde un error afectaría directamente a los usuarios.

En el **backend** probé:

- **Cantidades de productos:** que sean enteras y positivas, y que no se puedan modificar productos durante una compra en curso. Esto evita cantidades incorrectas o cambios mientras alguien está comprando.
- **Permisos de usuarios:** que se respeten los hogares y los roles de cada integrante. Esto evita que una persona acceda o modifique información que no le corresponde.
- **Gestión de compras:** que las fechas sean válidas y que las cantidades compradas respeten los límites permitidos. Esto evita registrar compras con datos incorrectos.
- **Catálogo:** que los nombres equivalentes no generen productos duplicados y que las sugerencias aparezcan ordenadas por relevancia.

En el **frontend** probé principalmente las validaciones de fechas, el manejo de respuestas de la API y las sugerencias del catálogo.

Utilicé tests parametrizados para probar varios valores de una misma regla, casos de error para verificar los rechazos y mocks para reemplazar dependencias externas.

### 2. Herramientas utilizadas y adaptación a mi stack

Como ListaFácil utiliza Node.js y TypeScript en el backend, y React con TypeScript en el frontend, adapté las herramientas de la guía a mi aplicación.

| Requisito | Herramienta utilizada |
|---|---|
| Tests automatizados | Vitest |
| Tests parametrizados | `it.each` |
| Mocks | `vi.fn`, `vi.mock` y dependencias inyectadas |
| Medición de cobertura | `@vitest/coverage-v8` |
| Umbral que provoca el fallo | `coverage.thresholds` de Vitest |
| Archivos incluidos y excluidos | `coverage.include` y `coverage.exclude` |

En ambos proyectos utilicé Vitest 5.0.3. Los tests siguen la estructura AAA: preparar los datos, ejecutar la operación y comprobar el resultado.

Para los mocks simulé dependencias como Prisma en el backend y las solicitudes a la API en el frontend. Esto permite verificar las reglas sin conectarme a una base de datos o servidor real.

### 3. Refactorizaciones para poder utilizar mocks

Al comenzar, algunas reglas estaban directamente relacionadas con el acceso a la base de datos o con los componentes del frontend, lo que dificultaba probarlas de manera aislada.

En el backend separé la lógica de agregado de productos en `add-shopping-list-item.ts` y permití que recibiera sus dependencias desde afuera. De esta manera, en producción utiliza los servicios reales, pero durante los tests puedo reemplazarlos por mocks.

En el frontend separé la validación de fechas en `purchase-date.ts` y permití reemplazar el cliente de API utilizado por `PurchasePage`.

**No agregué reglas de negocio artificiales para cumplir con la cantidad de tests.** Las reglas ya existían; lo que hice fue separarlas para poder verificarlas sin depender de toda la aplicación.

### 4. Umbrales de cobertura elegidos

Configuré la medición de cobertura de líneas y ramas en ambos proyectos.

La cobertura de **líneas** indica qué parte del código se ejecutó durante los tests. La cobertura de **ramas** permite saber si se probaron los distintos caminos de una condición, por ejemplo, cuando un `if` puede cumplirse o no.

Elegí los siguientes umbrales:

| Proyecto | Mínimo de líneas | Mínimo de ramas |
|---|---:|---:|
| Backend | 13% | 13% |
| Frontend | 48% | 35% |

Elegí estos valores después de medir la cobertura inicial de ListaFácil. Como la aplicación ya estaba desarrollada y todavía había funcionalidades sin tests, decidí establecer mínimos cercanos a la cobertura existente.

El objetivo no era afirmar que esos porcentajes fueran suficientes para garantizar calidad, sino **evitar que nuevos cambios disminuyeran la cobertura por debajo del mínimo establecido**.

Después de incorporar los tests del PR #28, los resultados de `main` fueron:

| Proyecto | Cobertura de líneas | Cobertura de ramas |
|---|---:|---:|
| Backend | 20,07% | 25,62% |
| Frontend | 61,90% | 47,34% |

Estos resultados se pueden verificar en la [corrida verde del PR #28](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37985981767).

### 5. Archivos excluidos de la cobertura

Decidí excluir archivos que no contienen reglas de negocio propias o que son generados automáticamente, para que la medición se concentre en el código de la aplicación.

**Backend:**

- `src/generated/**`: código generado automáticamente por Prisma.
- `src/routes/**/*.routes.ts`: archivos que conectan las rutas con sus controllers, sin implementar las reglas de negocio.
- `src/types/**/*.d.ts`: declaraciones de tipos, sin lógica ejecutable.
- `src/data/default-catalog.ts`: datos constantes del catálogo inicial.

**Frontend:**

- `src/**/*.d.ts`: declaraciones de tipos.
- `src/types/index.ts`: definiciones de tipos e interfaces.
- `src/main.tsx`: archivo encargado de iniciar y montar React.

Los servicios, controllers y componentes donde se implementa la lógica permanecen incluidos en la medición.

No excluí archivos simplemente porque tuvieran poca cobertura.

### 6. Por qué una cobertura alta no garantiza calidad

La cobertura indica qué código fue ejecutado, pero no garantiza que los tests estén comprobando correctamente los resultados.

Por ejemplo, al agregar tres unidades de un producto a ListaFácil, un test podría verificar solamente que se ejecutó la operación de actualización. Ese test podría pasar incluso si la aplicación incrementara la cantidad en una sola unidad.

Por eso, en mis pruebas también verifico que la cantidad utilizada sea exactamente la solicitada.

**La cobertura ayuda a encontrar código sin probar, pero la calidad depende de qué comportamiento comprueba cada test.**

### 7. Demostración del bloqueo de merge

Extendí los jobs `build-backend` y `build-frontend` del TP4 para que ejecutaran los tests con cobertura.

Ambos siguen configurados como **Required checks** de `main`. Si la cobertura queda por debajo de alguno de los umbrales, el job falla y GitHub bloquea el merge.

**Primer PR: fallo, corrección y merge**

En el [PR #28](https://github.com/jazminmorenasanchez/ListaFacil/pull/28) incorporé sugerencias automáticas de productos al catálogo.

Primero agregué la funcionalidad sin tests nuevos. Aunque las compilaciones y los tests existentes pasaban, la cobertura quedó por debajo de los mínimos:

- Backend: 12,50% de ramas, frente al 13% requerido.
- Frontend: 44,76% de líneas y 33,51% de ramas, frente al 48% y 35% requeridos.

La [corrida roja](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37984846990) demuestra que los checks fallaron por cobertura.

Para resolverlo agregué tests que verifican el orden de las sugerencias, la normalización de nombres, los límites, los permisos y el comportamiento de las sugerencias en el frontend.

Con esos tests, ambos proyectos superaron los umbrales, los checks quedaron verdes y pude realizar el merge. Esto se verifica en la [corrida verde](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37985981767).

**Segundo PR: bloqueo vigente**

En el [PR #29](https://github.com/jazminmorenasanchez/ListaFacil/pull/29) incorporé la exportación CSV de la lista de compras con una vista previa antes de descargar.

Dejé esta funcionalidad sin tests nuevos para demostrar que el pipeline continúa bloqueando cambios que reducen la cobertura.

El frontend quedó con **46,10% de líneas**, por debajo del 48% requerido, aunque los 36 tests existentes pasaron y la imagen se construyó correctamente.

El [primer intento de GitHub Actions](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37989195465/attempts/1) demuestra ese fallo por cobertura.

El PR permanece abierto y sin merge para mostrar el bloqueo durante la defensa.

### 8. Ejercicio de una rama de código sin cubrir

Al revisar el reporte de cobertura encontré una condición sin cubrir en `backend/src/services/purchase.service.ts`, aproximadamente en la línea 143.

La condición verifica si el usuario que intenta registrar cantidades compradas es distinto del responsable de la compra:

```ts
if (purchase.responsibleUserId !== userId)
  throw new AppError(403, 'Solo el responsable puede registrar cantidades compradas')
```

**Camino sin cubrir:** el caso en el que el usuario no es el responsable y la operación debe rechazarse.

**Entrada concreta:** una compra en curso cuyo responsable es `user-1`, mientras `user-2` intenta registrar una unidad de un producto.

**Resultado esperado:** error 403, sin modificar la cantidad comprada.

**Decisión:** no agregué ese test en esta entrega, pero identifiqué que debería incorporarlo posteriormente porque verifica una regla importante de autorización.

### 9. Problemas encontrados y uso de IA

**Problemas y soluciones**

El primer problema fue que algunas reglas estaban acopladas a dependencias externas. Lo resolví separando la lógica e incorporando dependencias que podían reemplazarse por mocks durante los tests.

También comprobé que agregar código nuevo sin tests no necesariamente hace caer la cobertura por debajo del umbral. En el segundo PR, la exportación CSV inicial todavía mantenía la cobertura por encima del mínimo. Al incorporar una vista previa útil para revisar los productos antes de descargarlos, aparecieron nuevos caminos sin cubrir y el frontend quedó por debajo del umbral de líneas, sin modificar los thresholds.

Durante las corridas de GitHub Actions también apareció un error `429 Too Many Requests` de Docker Hub al descargar imágenes base. Ese error era externo y ocurría antes de ejecutar los tests. Por eso utilicé como evidencia la corrida que efectivamente llegó a medir cobertura, y no la que falló por infraestructura.

**Uso de inteligencia artificial**

Utilicé ChatGPT para interpretar la consigna, organizar el trabajo y revisar las decisiones técnicas. También utilicé Codex para analizar el código, implementar cambios y desarrollar pruebas.

Comprobé los resultados mediante compilaciones, ejecución de tests, reportes de cobertura y corridas de GitHub Actions.