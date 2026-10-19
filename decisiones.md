# Decisiones

## Índice

- [TP1 - Git colaborativo](#tp1---git-colaborativo)
- [TP2 - Contenedores: la app del semestre](#tp2--contenedores-la-app-del-semestre)
- [TP3 - Planificación y trazabilidad](#tp3--planificación-y-trazabilidad)
- [TP4 - CI: Pipelines as Code](#tp4---ci-pipelines-as-code)
- [TP5 - Tests y cobertura como requisito de merge](#tp5---tests-y-cobertura-como-requisito-de-merge)
- [TP6 — Continuous Delivery](#tp6--continuous-delivery)
- [TP7 — CI/CD con imágenes y pruebas automatizadas](#tp7--cicd-con-imágenes-y-pruebas-automatizadas)


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

## TP6 — Continuous Delivery

## Enlaces de este TP — TP6

- [Paquete público del backend en GHCR](https://github.com/jazminmorenasanchez/ListaFacil/pkgs/container/listafacil-backend).
- [Paquete público del frontend en GHCR](https://github.com/jazminmorenasanchez/ListaFacil/pkgs/container/listafacil-frontend).
- En ambos paquetes, la versión de referencia es `sha-1e15efbf999c9f6144903d34d8e555d29e1626e5`, correspondiente al merge del PR #38.
- [Job del PR #32 para revisar que «Entrar al registry» se saltea](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/38147925162/job/114495075443?pr=32).
- [Corrida de main posterior al merge del PR #38: builds, QA y PROD](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/38186585823).
- QA: [backend](https://listafacil-api-qa.onrender.com) y [frontend](https://listafacil-web-qa.onrender.com).
- PROD: [backend](https://listafacil-api-prod.onrender.com) y [frontend](https://listafacil-web-prod.onrender.com).

### 1. Publicación de imágenes verificadas

Se decidió publicar las imágenes Docker de ListaFácil en GitHub Container Registry (GHCR) únicamente después de que las verificaciones correspondientes hayan finalizado correctamente.

En los Pull Requests, el pipeline ejecuta las verificaciones y construye las imágenes, pero no las publica. La publicación se realiza solamente en los pushes a `main`, una vez superados los controles del componente.

Esta decisión permite utilizar el registry como fuente de artefactos previamente verificados. Si se publicaran imágenes aunque fallaran los tests o la compilación, su presencia en el registry dejaría de representar que ese componente superó los controles de calidad.

Cada job publica su imagen de manera independiente: el backend puede publicarse aunque falle el frontend. Sin embargo, el despliegue a QA requiere que ambos jobs terminen correctamente, evitando desplegar una versión de la aplicación con verificaciones fallidas.

Las imágenes se identifican mediante el SHA del commit, lo que permite relacionarlas con el código que las generó.

### 2. Continuous Delivery y Continuous Deployment

Se implementó **Continuous Delivery**, ya que los cambios que superan las verificaciones se despliegan automáticamente a QA, pero requieren aprobación humana antes de llegar a producción.

La diferencia con Continuous Deployment es que este último automatiza también el despliegue a PROD, sin una aprobación manual.

Se eligió Continuous Delivery porque permite comprobar el funcionamiento de los cambios en QA antes de autorizar su llegada a producción. Esto resulta especialmente importante cuando existen modificaciones funcionales o migraciones de base de datos que requieren una revisión adicional.

### 3. Diseño del pipeline y separación de entornos

El pipeline ejecuta `build-backend` y `build-frontend` en paralelo. Mediante `needs`, `deploy-qa` espera que ambos finalicen correctamente, mientras que `deploy-prod` depende del éxito de `deploy-qa`.

Las condiciones `if` restringen los despliegues a los pushes sobre `main`, evitando que un Pull Request despliegue cambios que todavía no fueron integrados.

Se configuraron dos environments de GitHub:

- `qa`: permite el despliegue automático.
- `production`: exige aprobación manual mediante Required reviewers.

Los secrets se separaron por entorno para evitar que un despliegue de QA utilice accidentalmente los hooks o servicios de producción. Cada environment contiene los hooks de sus servicios y la credencial de acceso a la API de Render; los identificadores de servicios se almacenan como variables porque no son información sensible.

Los jobs de build utilizan `GITHUB_TOKEN` con permisos de publicación en GHCR, mientras que los jobs de despliegue solamente requieren lectura del repositorio y las credenciales correspondientes de Render.

### 4. Criterios de aprobación de producción

Antes de aprobar un despliegue a PROD, se decidió revisar que:

- Los builds y tests hayan finalizado correctamente.
- QA se haya desplegado y superado los smoke tests.
- El commit corresponda al cambio que se desea promover.
- El funcionamiento visible sea el esperado.
- No existan riesgos de compatibilidad asociados a cambios de base de datos.

Se demostró el funcionamiento del gate mediante un despliegue rechazado con motivo y otro aprobado. Para la aprobación se incorporó una etiqueta roja visible en ListaFácil, comprobando que primero aparecía en QA y que PROD solamente se actualizaba después de la autorización.

Además, se incorporó una validación que compara el SHA de la corrida con el HEAD actual de `main` antes de ejecutar los hooks de PROD. Si no coinciden, el despliegue se detiene. Esto evita aprobar tardíamente una corrida antigua que podría reemplazar una versión más reciente.

### 5. Limitaciones de Render Free

Se eligió Render Free para realizar el despliegue sin costos de infraestructura, aceptando sus restricciones.

Los servicios gratuitos pueden suspenderse después de 15 minutos sin tráfico, por lo que una nueva solicitud puede requerir un *cold start*. También existen límites de horas de ejecución y minutos de build, que pueden afectar la disponibilidad y los despliegues.

Para contemplar estas demoras, el pipeline implementa reintentos y tiempos máximos de espera: hasta 20 minutos para confirmar los despliegues, 5 minutos para los smoke tests y 30 minutos como límite del job.

Estos mecanismos permiten tolerar demoras transitorias, pero no solucionan cuotas agotadas ni errores permanentes. Por eso, el plan gratuito resulta adecuado para la demostración académica, pero no ofrece las garantías de disponibilidad necesarias para una producción real.

### 6. Alcance y limitaciones de los smoke tests

Se implementaron cuatro verificaciones posteriores al despliegue:

1. El backend responde correctamente en `/health`.
2. El frontend entrega el HTML de la aplicación.
3. El endpoint de login devuelve el error esperado para un usuario inexistente, comprobando una consulta a PostgreSQL.
4. La misma solicitud funciona a través del proxy Nginx del frontend.

Se eligieron estos controles porque permiten detectar problemas básicos de disponibilidad, conexión a la base de datos y comunicación entre frontend y backend sin modificar información.

Sin embargo, **un smoke test exitoso no garantiza que toda la aplicación funcione correctamente ni identifica por sí solo qué versión está ejecutándose**. Tampoco verifica todas las funcionalidades, permisos o escrituras.

Por ese motivo, el pipeline complementa los smoke tests consultando la API de Render para comprobar que ambos servicios tengan estado `live` y correspondan al SHA solicitado. Esto verifica el commit desplegado, aunque no demuestra la identidad exacta de las imágenes construidas.

### 7. Patrón de despliegue y reproducibilidad

**Plan de rollback y demostración**

Se decidió utilizar los Deploy Hooks de Render con un SHA explícito para recuperar una versión anterior conocida y verificada, sin depender del HEAD actual de `main`.

Primero se creó la release `v6.0.0`, apuntando al commit `1f8e5cf06dfe219d96f6e620d8510badcd615e32`, que estaba desplegado en ambos servicios de PROD.

Para demostrar el rollback, se incorporó un cambio posterior en `/health`, agregando el campo `version: "post-v6-rollback-demo"`. El cambio se integró mediante PR, superó las verificaciones, se desplegó automáticamente a QA y llegó a PROD después de la aprobación manual.

Una vez comprobado que la nueva versión estaba activa, se ejecutaron los Deploy Hooks del backend y frontend de PROD indicando el SHA de `v6.0.0`.

**El rollback tardó 63 segundos**, medidos desde el envío de los hooks hasta comprobar que ambos servicios figuraban como `Live` en Render con el commit anterior.

Finalmente, se verificó que `/health` volviera a responder sin el campo `version`, confirmando que se había restaurado el código de `v6.0.0`.

Este procedimiento revierte el código desplegado, pero **no deshace automáticamente migraciones de base de datos ni recupera datos eliminados**. Por eso, ante cambios de esquema incompatibles, sería necesario evaluar la compatibilidad de la versión anterior y un procedimiento de recuperación de datos.

### 8. Problemas encontrados y soluciones

**Error HTTP 400 al consultar la API de Render**

Durante el primer despliegue automático a QA, el pipeline falló porque la API de Render devolvía HTTP 400 al consultar los despliegues. Como no estaba claro si el problema era la autenticación, el endpoint o alguno de los parámetros enviados, decidimos aislar la causa antes de modificar el script principal.

Para ello, creamos temporalmente un workflow de diagnóstico en GitHub Actions que utilizaba las mismas credenciales de Render y ejecutaba tres consultas GET sobre los servicios de backend y frontend:

- **Consulta A:** sin el parámetro `createdAfter`, para comprobar que el endpoint y la autenticación funcionaban.
- **Consulta B:** con `createdAfter` expresado en UTC, con precisión de segundos y terminación `Z`.
- **Consulta C:** con el formato original utilizado por nuestro script, que incluía microsegundos y `+00:00`.

Las consultas A y B devolvieron HTTP 200, mientras que la C devolvió HTTP 400. Esta comparación permitió identificar que el problema estaba específicamente en el formato de fecha y no en las credenciales ni en el endpoint.

Elegimos realizar el diagnóstico mediante consultas GET porque **solamente recuperaban información de los despliegues**: no ejecutaban hooks, no iniciaban nuevos despliegues y no modificaban los servicios ni las bases de datos. Además, al utilizar un workflow separado, pudimos probar distintas hipótesis sin alterar el pipeline principal.

Una vez identificada la causa, corregimos el formato de fecha en el script para enviarla como `YYYY-MM-DDTHH:MM:SSZ`, agregamos una prueba de regresión y eliminamos el workflow temporal. Después verificamos que el despliegue a QA finalizara correctamente.

**Aprobación manual de producción no aplicada en la primera ejecución**

Durante la primera ejecución del despliegue a PROD, observamos que el job se ejecutó automáticamente, sin solicitar la aprobación manual que habíamos previsto.

Al revisar la configuración del environment `production`, identificamos que habíamos seleccionado el reviewer requerido, pero olvidado guardar las protection rules mediante **Save protection rules**. Por lo tanto, GitHub todavía no estaba aplicando esa restricción.

Guardamos correctamente la configuración y volvimos a ejecutar el workflow para verificarla. Esta vez, `deploy-prod` quedó detenido en **Waiting for review**, confirmando que la aprobación manual era obligatoria.

Para demostrar el rechazo, seleccionamos **Reject** y justificamos que se trataba de una nueva ejecución de un commit que ya había sido desplegado exitosamente en producción. No existían cambios nuevos que justificaran repetir ese despliegue.

Posteriormente, realizamos otro cambio visible en el frontend, incorporando la etiqueta roja `TP6 · Deploy PROD`. Después del merge comprobamos que la etiqueta aparecía automáticamente en QA, mientras que PROD conservaba la versión anterior. Recién después de aprobar manualmente el despliegue, la etiqueta apareció también en producción.

De esta manera verificamos tanto el rechazo como la aprobación, y comprobamos que la configuración del environment efectivamente controla cuándo un cambio puede llegar a PROD.

### 9. Uso de inteligencia artificial

Se utilizaron ChatGPT y Codex como herramientas de apoyo para interpretar la consigna, analizar alternativas, implementar y depurar el pipeline, desarrollar pruebas y redactar la documentación.

Las decisiones técnicas se revisaron en función de los requisitos del TP y se verificó su funcionamiento mediante las ejecuciones de GitHub Actions y las comprobaciones realizadas en QA y PROD.

# TP7 — CI/CD con imágenes y pruebas automatizadas
## Enlaces del TP7

### Paquetes públicos en GHCR

- **Backend:** https://github.com/jazminmorenasanchez/ListaFacil/pkgs/container/listafacil-backend
- **Frontend:** https://github.com/jazminmorenasanchez/ListaFacil/pkgs/container/listafacil-frontend
- **Etiqueta de ambas imágenes de la corrida verde:** `sha-1897aa43426e7f54f2113ebe18e44a4b2e69be59`

### Corridas y evidencias

**Demostración del gate E2E:**

- Commit que introdujo el error: `c89c0fc356e6d8ff3f61d51294efd36abfa2d7ef` [merge del PR #46](https://github.com/jazminmorenasanchez/ListaFacil/pull/46).
- Corrida con integración verde, E2E roja y PROD bloqueado: https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/39157198760
- Reporte de integración verde: artefacto `integracion-playwright` de esa corrida.
- Reporte E2E rojo: artefacto `e2e-playwright` de la misma corrida, con el reporte HTML y la traza del error.

**Corrección y promoción:**

- Corrida completamente verde, incluido el despliegue a PROD: https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/39159605407

### Entornos

- **Frontend QA:** https://listafacil-web-qa.onrender.com
- **Backend QA:** https://listafacil-api-qa.onrender.com
- **Frontend PROD:** https://listafacil-web-prod.onrender.com
- **Backend PROD:** https://listafacil-api-prod.onrender.com

---

## 1. Construcción y promoción de imágenes

**Decisión:** decidí construir las imágenes del backend y frontend una sola vez en GitHub Actions, publicarlas en GHCR y utilizar esas mismas imágenes para QA y PROD.

**Justificación:** en el TP6, Render reconstruía la aplicación desde Git para cada entorno. Esto podía generar diferencias entre lo probado en QA y lo desplegado en PROD. En el TP7, en cambio, verifico las imágenes en QA y promuevo esas mismas imágenes a producción, sin reconstruirlas (*build once, deploy many*).

Esta construcción única se refiere a las imágenes publicadas que se promueven entre entornos. El pipeline también construye imágenes específicas para ejecutar los tests.

Cada imagen se publica con la etiqueta `sha-<commit>`, que permite identificar el commit del que proviene. Decidí no utilizar `latest` porque puede cambiar y no permite identificar claramente una versión específica.

**Servicios de Render:** reutilicé los cuatro servicios de QA y PROD que ya tenía desde el TP6. Cambié su configuración para que utilizaran imágenes de GHCR en lugar de construir desde Git. Así conservé las URLs existentes y evité mantener servicios duplicados.

La imagen configurada inicialmente en Render sirve como referencia de partida, pero no determina qué versión se ejecuta después de cada despliegue. El pipeline utiliza Deploy Hooks con `imgURL` para indicar qué imagen debe ejecutar cada servicio.

## 2. Etiquetas, release y verificación de imágenes

**Decisión:** decidí utilizar `sha-<commit>` para identificar las imágenes en GHCR y `v7.0.0` como nombre de la versión del TP7 en Git.

**Justificación:** la etiqueta SHA permite relacionar una imagen con el código utilizado para construirla. La release identifica una versión que efectivamente llegó a producción.

A partir del tag `v7.0.0` puedo obtener el commit y buscar las imágenes de backend y frontend con la etiqueta `sha-<commit>`.

El tag de la imagen puede volver a publicarse, por lo que no garantiza que su contenido permanezca siempre igual. El digest `sha256`, en cambio, identifica el contenido exacto de la imagen.

**Verificación:** el smoke comprueba que el servicio responde correctamente, pero no demuestra qué imagen está ejecutando. Por eso, configuré el pipeline para verificar también la referencia de imagen y su digest. En la defensa puedo mostrar los eventos de Render donde figura el despliegue mediante Deploy Hook.

El job de QA exporta los digests verificados de ambas imágenes. El job de PROD recibe esos valores y comprueba que los digests desplegados coincidan con los aprobados en QA. Además, antes de iniciar los despliegues de PROD, el script verifica que el SHA de la corrida siga siendo el HEAD de `main`, para evitar promover una corrida antigua.

## 3. Configuración del frontend para QA y PROD

**Decisión:** decidí utilizar la misma imagen del frontend en ambos entornos, configurando la dirección del backend al iniciar el contenedor.

**Justificación:** si incorporaba la URL de cada backend durante la construcción, necesitaba imágenes diferentes para QA y PROD.

Para ello, reutilicé la configuración de Nginx incorporada en el TP6, que utiliza la variable `BACKEND_URL` para dirigir las solicitudes al backend correspondiente al iniciar el contenedor. De esta manera, mantengo una sola imagen y modifico únicamente la configuración de cada entorno.

## 4. Estrategia de pruebas

**Decisión:** implementé tres pruebas de integración API y tres pruebas E2E con Playwright.

| Integración API | E2E |
|---|---|
| Registro, autenticación y sesión | Registro y creación de un hogar desde la interfaz |
| Catálogo, cantidades y urgencia | Agregar productos desde el catálogo y modificar la lista |
| Compra parcial y unidades pendientes | Realizar una compra parcial desde la interfaz |

Elegí estos recorridos porque representan funcionalidades importantes de ListaFácil: el acceso a la aplicación, la organización de la lista y la realización de compras.

**Justificación:** las pruebas de integración comprueban las reglas y respuestas del backend sin utilizar el navegador. Las E2E verifican que esos recorridos puedan completarse desde la interfaz.

Decidí no incluir todas las validaciones en ambas suites. Las comprobaciones más específicas quedan principalmente en pruebas unitarias y de backend, mientras que las E2E se concentran en recorridos importantes. Esto sigue la idea de la pirámide de pruebas: tener más verificaciones rápidas y menos pruebas completas de navegador.

Las pruebas utilizan el backend y PostgreSQL reales, sin reemplazarlos por mocks. Configuré cada prueba para que cree datos propios y realice una limpieza posterior, con el objetivo de reducir interferencias.

## 5. Integración amplia y protección de PROD

**Decisión:** elegí ejecutar las pruebas de integración contra la API ya desplegada en QA, en lugar de iniciar una API temporal dentro del job.

**Justificación:** esta integración amplia me permite comprobar el comportamiento del servicio realmente desplegado, incluyendo su conexión con la base de datos. Como desventaja, dependo de la disponibilidad y velocidad del entorno remoto.

También incorporé una validación de URLs para que las pruebas solamente puedan ejecutarse contra servicios locales o QA.

La validación distingue el destino según su función: acepta únicamente el backend QA para las llamadas API y el frontend QA para el navegador. Rechaza PROD, otros destinos remotos y las URLs de QA intercambiadas.

Esto es importante porque las pruebas crean y eliminan información. Si configurara accidentalmente una URL de PROD, la ejecución se rechazaría antes de modificar datos de producción.

## 6. Pipeline y gate de promoción

**Decisión:** organicé el pipeline de la siguiente manera:

`Build → Deploy QA + smoke → Integración → E2E → Aprobación PROD → Deploy PROD`

**Justificación:** primero compruebo que la aplicación pueda construirse y que los servicios respondan. Después verifico el backend mediante integración y, finalmente, los recorridos completos mediante E2E.

Utilicé `needs` para establecer estas dependencias. Si integración falla, E2E no se ejecuta; si E2E falla, PROD queda bloqueado.

Además, mantuve la aprobación manual para desplegar a producción. Por eso, mi estrategia corresponde a *Continuous Delivery*: el pipeline prepara y verifica la versión, pero yo autorizo su publicación.

## 7. Cold start y concurrencia

**Decisión:** configuré timeouts y un reintento en Playwright para contemplar las demoras ocasionales del entorno gratuito de Render.

**Justificación:** después de un período de inactividad, los servicios pueden tardar en responder. Un test *flaky* es una prueba que a veces pasa y otras falla sin que haya cambiado el código. Los reintentos ayudan frente a demoras puntuales, aunque no eliminan todas las posibles causas de inestabilidad.

Una prueba que falla inicialmente y pasa en el reintento puede dejar el job verde; por eso, también conviene revisar los casos inestables del reporte.

También configuré concurrencia a nivel workflow para evitar que dos corridas de `main` utilicen QA simultáneamente. Los pushes a `main` comparten un grupo con `cancel-in-progress: false`, mientras que los Pull Requests utilizan grupos independientes.

Esto es importante porque QA es un entorno compartido: si una corrida desplegara una versión nueva mientras otra está probando, los resultados podrían ser incorrectos.

Como limitación, una corrida puede quedar esperando mientras otra aguarda aprobación de PROD. Esta protección tampoco controla despliegues manuales externos al workflow.

Además, `cancel-in-progress: false` protege la corrida activa, pero no garantiza conservar todas las pendientes: al no configurar `queue: max`, una nueva corrida puede reemplazar a otra que esté esperando en la cola de concurrencia.

## 8. Problemas encontrados y soluciones

**1. Cambiar el mecanismo de despliegue del TP6**

En el TP6, Render reconstruía la aplicación desde Git. Para el TP7 necesitaba desplegar imágenes previamente construidas y verificadas.

**Solución:** reutilicé los servicios existentes, los configuré para consumir imágenes de GHCR y adapté el pipeline para enviar `imgURL` mediante los Deploy Hooks. También incorporé la verificación de referencia y digest de imagen.

**2. Utilizar el mismo frontend en QA y PROD**

Necesitaba que el frontend se conectara al backend correspondiente sin construir una imagen diferente para cada entorno.

**Solución:** reutilicé la configuración de Nginx del TP6 con `BACKEND_URL` al iniciar el contenedor, separando la imagen de la configuración del entorno.

**3. Evitar interferencias entre las pruebas**

Las pruebas crean usuarios, hogares, productos y compras. Reutilizar los mismos datos podía provocar interferencias entre ejecuciones.

**Solución:** generé datos únicos para cada prueba, incorporé limpieza posterior y configuré las suites para ejecutarse con un solo worker.


## 9. Limitaciones

Las seis pruebas automatizadas cubren recorridos importantes, pero no todas las funcionalidades ni todos los navegadores. Además, dependo de la disponibilidad de QA y de que la limpieza de los datos de prueba se complete correctamente.

Aunque promuevo las mismas imágenes, frontend y backend se despliegan como servicios separados. También debo considerar que revertir una imagen no revierte automáticamente los cambios realizados en la base de datos.

## 10. Uso de inteligencia artificial

Utilicé ChatGPT y Codex como apoyo para analizar los requisitos, implementar y revisar configuraciones, preparar pruebas automatizadas, interpretar errores y redactar la documentación.

Adapté las decisiones a ListaFácil y a los requisitos del TP7. Verifiqué su funcionamiento mediante pruebas locales, GitHub Actions, reportes de Playwright y despliegues en QA y PROD.
