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

## TP5 - Tests y cobertura como requisito de merge

### Objetivo y adaptación de la guía al stack de ListaFácil

El objetivo del TP5 fue incorporar pruebas significativas y comprobar que una pérdida de cobertura pudiera impedir el merge, aunque la compilación y los tests ejecutados funcionaran correctamente. Trabajé sobre el backend Node.js + TypeScript y el frontend React + TypeScript de ListaFácil.

En ambos proyectos utilicé Vitest 5.0.3 y `@vitest/coverage-v8` 5.0.3. Las versiones resueltas están registradas en los lockfiles y los Dockerfiles ejecutan `npm ci`, que instala conforme a esos archivos. En backend las dependencias declaran `^5.0.3`, mientras que en frontend declaran `5.0.3`; por eso distingo el rango de `package.json` de la versión efectivamente fijada en el lockfile.

La guía usa ejemplos de .NET, pero no incorporé herramientas de ese stack a la aplicación. Adapté los mecanismos: `it.each` —o su equivalente `test.each`— para parametrizar; `vi.fn`, `vi.mock` y dependencias inyectadas para dobles; coverage V8 para medir; `coverage.thresholds` para hacer fallar Vitest; e `include`/`exclude` para definir la población. Las configuraciones están en [backend/vitest.config.mts](backend/vitest.config.mts) y [frontend/vite.config.ts](frontend/vite.config.ts).

### Lógica de negocio elegida y consecuencias de los errores

Elegí reglas que afectan operaciones reales de compras compartidas, en lugar de probar funciones sin uso sólo para aumentar porcentajes.

En el agregado a la lista probé que la cantidad sea un entero positivo, que se use 1 cuando no se informa y que una compra en curso bloquee modificaciones. Una cantidad inválida o una edición durante la compra podría cambiar lo que el responsable necesita comprar. En [add-shopping-list-item.test.ts](backend/tests/add-shopping-list-item.test.ts) están, entre otros, los tests «rechaza cantidad inválida %s antes de abrir una transacción» y «rechaza una compra IN_PROGRESS con AppError 409 antes de buscar el producto o ejecutar upsert». También se comprueba que un producto inexistente o ajeno al hogar no llegue al upsert.

En autorización probé usuario inexistente, usuario sin hogar, rechazo de MEMBER cuando se exige administrador y permiso de ADMIN. Un error en esas decisiones podría permitir acciones de administración a quien no corresponde. La tabla de escenarios está en [household-access.test.ts](backend/tests/household-access.test.ts), sobre `requireHousehold` y `requireHouseholdAdmin`.

En compras elegí fechas inválidas, pasadas o iguales a ahora; estados y responsable al iniciar; y límites de cantidad comprada. Un fallo podría programar compras vencidas, iniciar una compra en un estado incorrecto o registrar cantidades superiores a las necesarias. [purchase-service.test.ts](backend/tests/purchase-service.test.ts) contiene «rechaza fecha $date antes de abrir una transacción», «iniciar compra: $scenario» y «valida límites de cantidad comprada: $quantity».

En catálogo probé normalización y equivalencia de nombres para evitar duplicados como «Café molido» y «CAFE MOLIDO». Los límites de longitud y comparaciones están en [product-name.test.ts](backend/tests/product-name.test.ts); el rechazo del duplicado y la creación con nombre normalizado están en [catalog-service.test.ts](backend/tests/catalog-service.test.ts).

Posteriormente agregué sugerencias por relevancia como funcionalidad nueva: coincidencia exacta, prefijo, palabras en diferente orden y fragmento, con desempates determinísticos y límites. Esto ayuda a encontrar productos mientras se escribe, conservando la búsqueda tradicional. Su ranking se prueba en [catalog-suggestions.test.ts](backend/tests/catalog-suggestions.test.ts), el alcance por hogar en [catalog-suggestions-service.test.ts](backend/tests/catalog-suggestions-service.test.ts) y los parámetros del controller en [catalog-suggestions-controller.test.ts](backend/tests/catalog-suggestions-controller.test.ts). Esta incorporación corresponde al [PR #28](https://github.com/jazminmorenasanchez/ListaFacil/pull/28), y no a una regla que ya existiera antes de los tests.

### Técnicas de prueba: AAA, parametrización, bordes y dobles

Un ejemplo de Arrange/Act/Assert es el test «rechaza un producto inexistente o ajeno al hogar sin ejecutar upsert». En Arrange preparo las dependencias y hago que el lookup del catálogo devuelva `null`. En Act llamo al agregado con usuario, producto y cantidad. En Assert verifico `AppError`, status 404, mensaje exacto, lookup restringido al hogar y ausencia de upsert. No alcanza con comprobar que ocurrió cualquier error: importa que se rechace por la causa prevista y antes de escribir.

Usé `it.each` para recorrer variantes de una misma regla. Entre los bordes están cantidad 0, negativa y fraccionaria; nombre de 120 caracteres aceptado y de 121 rechazado; fecha exactamente igual a ahora; cantidad comprada cero y límite superior; y límites de sugerencias inválidos. Las assertions verifican resultados, status, mensajes e interacciones relevantes, sin agregar variantes sólo para aumentar la cantidad de casos.

Para backend utilicé mocks de Prisma y autorización, además de dependencias inyectadas en el agregado a la lista. Los fakes de `$transaction` ejecutan el callback con los métodos necesarios. Para fechas fijé el reloj y lo restauré después. Estas pruebas no requieren PostgreSQL ni `DATABASE_URL`, pero tampoco demuestran rollback, aislamiento o concurrencia reales de la base de datos. Los tests directos del controller usan dobles de Request/Response: no verifican el transporte HTTP ni el montaje completo de Express.

En frontend separé lógica pura de componentes. [purchase-date.test.ts](frontend/tests/purchase-date.test.ts) declara entorno Node y contiene cinco casos sin DOM en dos declaraciones `it.each`: fecha claramente posterior, 1 ms posterior, 1 ms anterior, fecha igual a ahora y `NaN`. No los describo como cuatro declaraciones independientes ni cuento los tests de componentes como pruebas sin DOM.

Los tests de [purchase-page.test.tsx](frontend/tests/purchase-page.test.tsx), [shopping-list-page.test.tsx](frontend/tests/shopping-list-page.test.tsx) y [catalog-suggestions-page.test.tsx](frontend/tests/catalog-suggestions-page.test.tsx) sí montan componentes con DOM. Verifican interacción, permisos visibles, fechas que vencen antes del envío, debounce de 300 ms, resultados vacíos, errores, agregado de sugerencias, respuestas desactualizadas y limpieza al desmontar. Para eso utilicé API mockeada o inyectada, timers falsos y promesas controladas, sin solicitudes de red reales.

En [api.test.ts](frontend/tests/api.test.ts) sustituí fetch con `vi.stubGlobal` y utilicé Responses con su lectura JSON simulada. Probé headers y token, respuesta 204 sin intentar leer JSON y errores HTTP 422, 500, 502 y 401. Se comprueba el mensaje del servidor, el fallback cuando falta mensaje o falla JSON y el evento de sesión no autorizada cuando corresponde. Algunos casos usan eventos de `window`, por lo que no los presento como una suite íntegramente sin DOM. Los globals se restauran y los listeners se retiran.

### Refactors para aislar dependencias sin inventar reglas

Para testear el agregado extraje [add-shopping-list-item.ts](backend/src/services/add-shopping-list-item.ts), con interfaces para autorización y transacción y la factory `createAddShoppingListItem`. [shopping-list.service.ts](backend/src/services/shopping-list.service.ts) conecta esas dependencias con Prisma en producción. La validación de cantidad, el bloqueo y el upsert ya existían; el cambio permitió aislarlos sin utilizar la base real.

En frontend extraje la validación de fecha a [purchase-date.ts](frontend/src/lib/purchase-date.ts) y agregué el parámetro opcional `request` a [PurchasePage.tsx](frontend/src/pages/PurchasePage.tsx), con `apiRequest` como valor predeterminado. La regla de fecha futura también existía: se separó para probarla como función pura. El diff histórico del commit `b3af1af` permite comprobar estas extracciones. No agregué esas reglas para alcanzar el mínimo del TP.

### Medición y elección de thresholds

Configuré provider V8 y reporters `text`, `html` y `json-summary` en ambos proyectos; backend también genera `json`, que permite consultar contadores de ramas de código. El HTML sirve para explorar archivos y caminos, mientras que el resumen JSON aporta porcentajes y fracciones verificables.

Al configurar los thresholds, la suite backend completa medía lines 14.23% (73/513) y branches 14.33% (40/279). Fijé mínimos de 13% para ambas métricas. En frontend la suite medía lines 51.08% (47/92) y branches 37.95% (63/166), y fijé mínimos de 48% y 35%. Son valores próximos, pero inferiores, a las mediciones de ese momento: permitían conservar la suite verde y detectar una pérdida significativa de pruebas. No copié el 70% de un ejemplo ni interpreté estos mínimos como una certificación de calidad de todo el backend.

La demostración frontend quedó en el [PR #26](https://github.com/jazminmorenasanchez/ListaFacil/pull/26). Al omitir temporalmente una declaración de cinco casos HTTP, los 20 casos ejecutados pasaron, pero coverage cayó a lines 45.65% y branches 33.73%, incumpliendo ambos mínimos en la [corrida roja](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37540531404). Después restauré la declaración y la [corrida verde](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37540805578) confirmó la recuperación.

En backend, el [PR #27](https://github.com/jazminmorenasanchez/ListaFacil/pull/27) comprobó el mismo mecanismo. La omisión temporal de los cinco casos de cantidad comprada dejó 34 casos aprobados, pero lines 11.69% y branches 11.11%, con falla de ambos thresholds en la [corrida roja](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37980894972). Restauré los tests antes de la [corrida verde](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37981190836) y del merge. Esas omisiones fueron ejercicios controlados de los gates, no el estado final de las suites.

Después del merge del PR #28, el baseline de `main` pasó a ser:

| Proyecto | Lines | Branches | Casos aprobados |
|---|---:|---:|---:|
| Backend | 20.07% (110/548) | 25.62% (82/320) | 80 |
| Frontend | 61.90% (65/105) | 47.34% (89/188) | 36 |

Estos valores corresponden a la suite ampliada y no son las mediciones con las que inicialmente elegí 13/13 y 48/35. La recuperación está respaldada por la [corrida verde del PR #28](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37985981767). Reporto branches junto con lines porque ejecutar una línea no implica recorrer todas sus decisiones.

### Población de coverage y exclusiones justificadas

En backend conservé `include: ['src/**/*.ts']`, para que un service nuevo sin pruebas entre automáticamente y afecte la medición. Agregué exactamente estas exclusiones:

- `src/generated/**`: código y tipos generados por Prisma, no lógica escrita por nosotros.
- `src/routes/**/*.routes.ts`: wiring actual de rutas y middleware, sin reglas del dominio.
- `src/types/**/*.d.ts`: declaraciones de tipos, sin ejecución.
- `src/data/default-catalog.ts`: datos constantes del catálogo inicial; la operación que los utiliza sigue contando.

Controllers, services, middleware, `app.ts` y `lib/prisma.ts` permanecen incluidos, aunque tengan 0%. No excluí archivos por carecer de tests. El bootstrap del backend también contiene decisiones de CORS y errores; el adaptador Prisma valida configuración, por lo que no los traté automáticamente como código generado.

En frontend mantuve `include: ['src/**/*.{ts,tsx}']` y excluí exactamente `src/**/*.d.ts`, `src/types/index.ts` y `src/main.tsx`: declaraciones, interfaces/aliases y montaje inicial de React, respectivamente. Las páginas, helpers y cliente API siguen contando. Excluir wiring de la métrica no significa que su integración esté verificada: requiere pruebas apropiadas por separado. Las justificaciones corresponden al contenido actual de esas familias, no a cualquier comportamiento que pudiera agregarse allí en el futuro.

### CI, reportes y bloqueo de merge

Mantuve los jobs `build-backend` y `build-frontend` de [.github/workflows/ci.yml](.github/workflows/ci.yml). Cada uno construye la imagen normal de la aplicación y una imagen del target Docker `test`. Backend ejecuta `npm run test:coverage`; frontend ejecuta `npm run test:ci`. No incorporé PostgreSQL al contenedor de tests unitarios.

El recorrido del error es Vitest → script npm → proceso del contenedor ejecutado con `docker run` → paso de GitHub Actions → job → check Required de `main`. Vitest devuelve error cuando no alcanza el threshold y no hay `continue-on-error` ni `|| true` que neutralice ese resultado. La protección de `main` exige ambos checks, estar actualizado con la base y se aplica también a administradores. Los PR #26 y #27 enlazados muestran que coverage puede bloquear el merge aun cuando los casos ejecutados estén verdes.

Configuré `reportOnFailure: true` y publicación de summary y artefactos `backend-coverage` y `frontend-coverage`, descargables desde las corridas. Los pasos de publicación usan `!cancelled()` para ejecutarse también después de una falla. En la [corrida roja del PR #28](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37984846990) se publicaron ambos reportes. Si el build falla antes de ejecutar Vitest, esa condición no puede fabricar un reporte inexistente: backend advierte cuando falta y frontend marca error. Publicar un summary tampoco revierte una falla previa del job.

### Por qué coverage alto no garantiza calidad

`add-shopping-list-item.ts` tiene 100% de lines y branches en el baseline posterior al PR #28, pero un test que sólo comprobara «se llamó a upsert» podría aceptar un incremento incorrecto. Por ejemplo, incrementar 1 cuando se pidieron 3 unidades ejecutaría el mismo camino y perjudicaría la lista del hogar.

Por eso el test «agrega un producto del hogar con cantidad 3 mediante un único upsert de creación o incremento» comprueba `create: { catalogItemId: 'product-1', quantity: 3 }` y `update: { quantity: { increment: 3 } }`, además del resultado y del lookup del hogar. Puede verse en [add-shopping-list-item.test.ts](backend/tests/add-shopping-list-item.test.ts). El porcentaje muestra qué se ejecutó; esas assertions verifican qué hizo. Aun con ellas, el fake no prueba las garantías de transacción o concurrencia de PostgreSQL.

### Ejercicio de una rama de código sin cubrir

Identifiqué una decisión sin probar en [purchase.service.ts](backend/src/services/purchase.service.ts), alrededor de la línea 143:

```ts
if (purchase.responsibleUserId !== userId)
  throw new AppError(403, 'Solo el responsable puede registrar cantidades compradas')
```

El reporte JSON real del baseline posterior al PR #28 registra `[0, 3]` para ese `if`: el rechazo no se ejecutó y el camino permitido se recorrió tres veces. Se trata de una rama del código, no de una rama Git.

Una entrada concreta sería `updatePurchasedQuantity('user-2', 'item-1', 1)`, con hogar autorizado y compra `IN_PROGRESS` cuyo `responsibleUserId` sea `'user-1'`. El resultado esperado es 403 sin modificación del item; el rechazo ocurre antes de buscarlo o actualizarlo.

Decidí no agregar ese caso en esta entrega y dejarlo registrado como prueba prioritaria posterior. La regla impide que otro integrante registre compras en nombre del responsable. Ocultar el control en frontend no reemplaza la autorización backend. Un test con transacción fake podría comprobar el error exacto y la ausencia de escritura sin usar DB real.

### Primer PR de §3.5: sugerencias automáticas del catálogo

En el [PR #28](https://github.com/jazminmorenasanchez/ListaFacil/pull/28) agregué primero código productivo sin tests nuevos: ranking puro que reutiliza `comparableProductName`, service restringido al hogar, controller y endpoint dedicado, y sugerencias automáticas con debounce de 300 ms mientras se escribe. Conservé el botón Buscar y su comportamiento. El frontend cancela solicitudes anteriores e ignora respuestas desactualizadas.

En esa primera etapa las compilaciones y los tests existentes pasaban, pero backend quedó con branches 12.50% < 13%; frontend con lines 44.76% < 48% y branches 33.51% < 35%. La [corrida roja](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37984846990) muestra 39 casos backend y 25 frontend aprobados y los mensajes de threshold. No fue necesario bajar mínimos ni omitir tests para esta demostración.

Después agregué 41 casos backend y 11 frontend del comportamiento nuevo: ranking, límites, normalización, autorización/consulta, parámetros, debounce, errores, agregado y respuestas fuera de orden. Las suites quedaron en 80 y 36 casos aprobados. Coverage superó los thresholds originales, ambos checks quedaron verdes en la [corrida de recuperación](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37985981767) y el PR fue mergeado. Los tests agregados verifican la funcionalidad que provocó el rojo, no código ajeno elegido sólo para aumentar porcentajes.

### Segundo PR de §3.5: exportación CSV con vista previa

El [PR #29](https://github.com/jazminmorenasanchez/ListaFacil/pull/29) incorpora exportación de la lista con un consumidor real en `ShoppingListPage`. El usuario elige Pendientes/Todos, prepara una lectura actualizada mediante `/shopping-list` con token, revisa la instantánea y confirma la descarga o cancela. Cambiar el alcance descarta la vista previa y exige prepararla otra vez. La exportación sigue disponible durante una compra en curso porque no modifica datos.

Centralicé filtrado y cálculo de pendientes en [shopping-list-csv.ts](frontend/src/lib/shopping-list-csv.ts), compartidos por la tabla de preview y la serialización. Las columnas son Producto, Cantidad necesaria, Cantidad comprada, Cantidad pendiente y Urgente. Se conservan orden y nombres, se escapan comas/comillas/saltos de línea y se usan CRLF. La lista vacía y la ausencia de pendientes tienen mensajes distintos y permiten descargar sólo el encabezado. [download-csv.ts](frontend/src/lib/download-csv.ts) genera `lista-compras.csv` con Blob, MIME CSV, BOM UTF-8 para facilitar reconocimiento de Unicode en Excel y limpieza del enlace y URL temporales. La descarga usa las filas mostradas, sin una segunda consulta.

No agregué tests de esa exportación a propósito y el PR permanece abierto, sin merge, para la defensa. Backend no cambia. Frontend mide lines 46.10% (71/154), por debajo de 48%, y branches 41.93% (91/217), por encima de 35%. En el [intento 1](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37989195465/attempts/1), frontend construyó, aprobó 36 casos y falló específicamente por lines. Ese intento publicó su artefacto de coverage y sirve como evidencia del gate; el PR está bloqueado.

No todos los fallos de ese PR fueron por coverage. Backend ya sufrió un HTTP 429 de Docker Hub en el primer intento. En el [intento 2](https://github.com/jazminmorenasanchez/ListaFacil/actions/runs/37989195465/attempts/2), ambos jobs fallaron al resolver imágenes: `node:24-bookworm-slim` y `nginx:alpine`. No llegaron a ejecutar tests con coverage. Ese segundo intento demuestra un incidente de infraestructura, no el gate de cobertura, y no lo doy por resuelto.

### Problemas encontrados y cómo los abordé

El primer ajuste fue aislar dependencias para que los tests no necesitaran PostgreSQL ni red. Lo abordé con las extracciones y dobles descritos, conservando las reglas existentes y distinguiendo qué garantías podían verificar los fakes.

También comprobé que agregar funcionalidad sin tests no asegura automáticamente un rojo. La descarga CSV inmediata quedó inicialmente verde: frontend lines 50.73% (69/136) y branches 44.55% (90/202). No amplié el código con relleno ni cambié thresholds. La vista previa respondió a una necesidad concreta: revisar los productos y cantidades de la lectura actualizada antes de descargar exactamente esa instantánea. Con ese comportamiento real, el resultado pasó a lines 46.10% y branches 41.93%, como muestra el intento 1 del PR #29 enlazado.

Para las demostraciones de §3.5 mantuve todos los tests existentes habilitados. Los skips temporales de los ejercicios anteriores de thresholds fueron restaurados antes de sus merges. No confundo esos ejercicios con las dos funcionalidades nuevas de §3.5.

El HTTP 429 de Docker Hub impidió que la última corrida del PR #29 llegara a coverage. Conservé la distinción entre evidencia de aplicación y falla de infraestructura y registré el intento 1 como prueba válida. No afirmo que el incidente se haya solucionado ni alteré el PR abierto para ocultarlo.

### Declaración de uso de IA y verificación

Utilicé ChatGPT como apoyo para interpretar la consigna, diseñar las decisiones y revisar cómo explicarlas. Utilicé Codex para leer el repositorio, analizar población de coverage, implementar cambios y escribir pruebas del primer PR, además de preparar la exportación y su vista previa sin tests nuevos para el segundo.

La verificación se apoyó en revisión de diffs, builds, ejecución de tests, porcentajes y fracciones de coverage y consultas a GitHub Actions y Pull Requests. Las corridas enlazadas permiten comprobar el paso de rojo a verde y la causa concreta de cada fallo. No considero la respuesta de una IA ni un porcentaje como evidencia suficiente por sí solos, y no atribuyo a estas pruebas una validación manual completa de navegador, Excel, transporte HTTP o PostgreSQL real que no se haya realizado.
