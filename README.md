# Trabajo Práctico Integrador — Programación III UTN

## Avengers: Multiversal War

---

## El desafío

Galactus ha sido derrotado.

Después de que los Cuatro Fantásticos lograran detener al Devorador de Mundos,
Silver Surfer abandonó la Tierra y volvió a recorrer el cosmos. Por un breve
momento, parecía que el peligro había terminado.

Pero cerca de los límites del Sistema Solar, Silver Surfer se encontró con
Dormammu, soberano de la Dimensión Oscura.

Dormammu asegura que el antiguo acuerdo que impedía su avance ha sido roto y
acusa a Doctor Strange de no haber cumplido la promesa que mantenía protegida a
la Tierra.

Esta vez, la amenaza no alcanza solamente a nuestro mundo. Las barreras que
separan las distintas realidades están en peligro y el multiverso entero podría
quedar expuesto a la Dimensión Oscura.

Silver Surfer regresa a la Tierra con una advertencia:

> ningún héroe puede enfrentar solo lo que se aproxima.

Su respuesta es organizar el desafío más grande que los héroes hayan enfrentado:
el **Torneo Multiversal**.

- **32 Leaders**
- **32 Teams**
- **6 Heroes por Team**

Cada Leader deberá reunir un equipo de seis héroes y atravesar un torneo en el
que se pondrán a prueba su fuerza, resistencia, estrategia y capacidad para
trabajar juntos.

Fase de Grupos. Eliminatorias. Una Final.

---

## Tu misión

A tu grupo le será asignado un **Team del Torneo Multiversal** mediante el ID del
personaje que lo identifica.

Ese personaje definirá la identidad del Team durante todo el Trabajo Práctico.

A partir de allí deberán construir la aplicación que permitirá formar el equipo,
elegir a sus héroes, definir estrategias, atravesar el torneo y prepararse para
el desafío final.

**Tu equipo será el encargado de enfrentar este desafío.**

El Torneo Multiversal está por comenzar.

---

## Integrantes del grupo

Cada grupo estará formado por **10 integrantes** y tendrá asignado un Team del
Torneo Multiversal.

### Equipo asignado

**TEAM_ID:** `[black-widow]`

El personaje asignado identifica al Team que utilizará el grupo durante todo el
Trabajo Práctico.

Este valor debe configurarse en:

```text
backend/avengers-back/.env
```

mediante la variable:

```env
TEAM_ID=<id-del-personaje-asignado>
```

### Tech Lead

Debido a la cantidad de alumnos y grupos del curso, la cátedra utilizará al
Tech Lead como principal punto de contacto para realizar seguimientos y
consultas sobre el estado del proyecto.

Uno de los integrantes del equipo asumirá este rol y será responsable de
coordinar técnicamente el trabajo del grupo, organizar las integraciones entre
funcionalidades y facilitar la comunicación con la cátedra.

Entre sus responsabilidades se incluyen:

- Coordinar la división de tareas y el avance general del TP.
- Supervisar la integración entre las distintas funcionalidades.
- Validar que el proyecto pueda ejecutarse correctamente de punta a punta.
- Centralizar consultas técnicas y comunicación con la cátedra.
- Ayudar a destrabar problemas técnicos dentro del equipo.

**Nombre del Tech Lead:** `Joan Varela`

### Integrantes por funcionalidad

Cada integrante deberá desarrollar **una funcionalidad individual completa**.

Además, **todos los integrantes del grupo deberán participar en el desarrollo de
R9 — Batalla Final**.

En las funcionalidades individuales, **Integrante** identifica a quien la
desarrolla. Para R9, completen ese campo con quien coordinará el seguimiento
(se recomienda al Tech Lead); la implementación sigue siendo responsabilidad
de los diez integrantes.

| # | Integrante | Funcionalidad | Sección | Responsabilidad |
| ---: | --- | --- | --- | --- |
| 1 | `Nicolás Brito` | R2 — Historia y Rivales | Equipo | Individual |
| 2 | `Agustin Tieghi` | R3 — Configurar Equipo | Equipo | Individual |
| 3 | `[Joan Varela]` | R5 — Fase de Grupos | Camino | Individual |
| 4 | `Mateo Jalil` | R6 — Fase Eliminatoria | Camino | Individual |
| 5 | `Joaquin Spero` | R7 — Camino del Equipo | Camino | Individual |
| 6 | `Damonte Uriel` | R8 — Preparar Batalla Final | Batalla Final | Individual |
| 7 | `Joan Varela` | R9 — Batalla Final | Batalla Final | Grupal |
| 8 | `Matías Cancina` | R10 — Eventos en Vivo | Batalla Final | Individual |
| 9 | `Ramiro Gomez` | R11 — Estado del Equipo | Batalla Final | Individual |
| 10 | `[Completar]` | R12 — Estadísticas y Premios | Resultados | Individual |
| 11 | `[Completar]` | R13 — Historial | Resultados | Individual |

> **R9 — Batalla Final es obligatoria para la aprobación del TP y responsabilidad
del grupo completo.**
>
> Los diez integrantes deben participar de su desarrollo además de completar su
> funcionalidad individual. La Batalla Final debe poder jugarse de principio a
> fin sin errores.

---

## Funcionalidades provistas por la cátedra

El proyecto incluye dos funcionalidades completas que funcionan como referencia
para desarrollar el resto del Trabajo Práctico:

- **R1 — Héroes**
- **R4 — Simular Batallas**

Estas funcionalidades muestran el patrón esperado de arquitectura e
integración:

```text
Angular
    ↓
NestJS BFF
    ↓
Avengers Game API
```

Antes de comenzar el desarrollo de una funcionalidad, estudien cómo están
implementadas **Héroes** y **Simular Batallas**.

**Las funcionalidades provistas no deben modificarse.**

---

## Funcionalidades del Trabajo Práctico

### Equipo

- **R1 — Héroes** — Provista por la cátedra
- **R2 — Historia y Rivales** — Desarrollo individual
- **R3 — Configurar Equipo** — Desarrollo individual

### Camino

- **R4 — Simular Batallas** — Provista por la cátedra
- **R5 — Fase de Grupos** — Desarrollo individual
- **R6 — Fase Eliminatoria** — Desarrollo individual
- **R7 — Camino del Equipo** — Desarrollo individual

### Batalla Final

- **R8 — Preparar Batalla Final** — Desarrollo individual
- **R9 — Batalla Final** — Responsabilidad grupal
- **R10 — Eventos en Vivo** — Desarrollo individual
- **R11 — Estado del Equipo** — Desarrollo individual

### Resultados

- **R12 — Estadísticas y Premios** — Desarrollo individual
- **R13 — Historial** — Desarrollo individual

En total:

```text
13 funcionalidades
=
2 provistas por la cátedra
+
10 funcionalidades individuales
+
1 funcionalidad grupal
```

---

## Stack técnico

| Capa | Tecnología | Puerto | URL base |
| --- | --- | ---: | --- |
| Frontend | Angular — `avengers-front` | `:3102` | `http://localhost:3102` |
| Backend BFF | NestJS — `avengers-back` | `:4102` | `http://localhost:4102/gameCore` |
| API | Avengers Game API — infraestructura externa de la cátedra | `:5102` | `http://localhost:5102/game` |

> **Avengers Game API es provista por la cátedra, permanece fuera de `students/`
> y no debe modificarse.**

---

## Requerimientos generales de la aplicación

- **Sin login.** La aplicación inicia directamente en la experiencia del Team asignado.
- El Team del grupo se determina mediante `TEAM_ID`.
- El **menú lateral (sidebar)** contiene las 13 funcionalidades del TP.
- Cada funcionalidad es una vista independiente dentro de la aplicación.
- El frontend Angular **nunca llama directamente a Avengers Game API**.
- Todas las llamadas a Avengers Game API deben realizarse a través del BFF NestJS.
- Avengers Game API mantiene la autoridad sobre las reglas, el estado y los resultados del juego.
- Se debe respetar la arquitectura de los proyectos provista por la cátedra.
- Se deben respetar el stack técnico y las tecnologías vistas durante la cursada.
- Se debe conservar el sistema visual general y los assets provistos por la cátedra.
- Las funcionalidades provistas sirven como referencia de arquitectura para desarrollar las restantes.

---

## Configuración del Backend

El Team asignado al grupo se configura mediante las variables de entorno del
backend, antes de iniciar la aplicación.

Copien el archivo de ejemplo:

```bash
cp backend/avengers-back/.env.example backend/avengers-back/.env
```

Configuración de referencia:

```env
APP_HOST=localhost
APP_PORT=4102
APP_BASE_PATH=gameCore
CORS_ALLOWED_ORIGIN=http://localhost:3102
GAME_API_URL=http://localhost:5102
GAME_API_BASE_PATH=/game
TEAM_ID=<id-del-personaje-asignado>
APP_LANG=es
```

`TEAM_ID` corresponde al ID del personaje asignado al grupo. El Team se fija al
iniciar el BFF y **no debe implementarse un selector de Team en el frontend**.

---

## Cómo levantar el proyecto

Los tres servicios deben levantarse en este orden:

1. Avengers Game API oficial de la cátedra, desde su proyecto externo.
2. Avengers backend.
3. Avengers frontend.

### 1. Avengers Game API

El Game API se ejecuta desde el proyecto provisto por la cátedra, fuera de
`students/`, según las instrucciones de la cursada.

### 2. Avengers backend

```bash
cd backend/avengers-back
npm install
npm run start:dev
```

### 3. Avengers frontend

```bash
cd frontend/avengers-front
npm install
npm start
```

Verificar las aplicaciones y sus documentaciones Swagger en:

- **Avengers frontend:** `http://localhost:3102`
- **Avengers backend — Swagger:** `http://localhost:4102/gameCore/api`
- **Avengers Game API — Swagger:** `http://localhost:5102/game/api`

---

## Estructura del proyecto

```text
students/
├── frontend/
│   └── avengers-front/
│       └── src/app/
│           ├── core/
│           ├── shared/
│           └── features/
│               ├── team/
│               │   ├── hero-roster/       ← R1 — Héroes (Provista)
│               │   ├── history-rivals/    ← R2 — Historia y Rivales
│               │   └── team-config/       ← R3 — Configurar Equipo
│               ├── journey/
│               │   ├── simulate-journey/  ← R4 — Simular Batallas (Provista)
│               │   ├── group-stage/       ← R5 — Fase de Grupos
│               │   ├── knockout-stage/    ← R6 — Fase Eliminatoria
│               │   └── team-journey/      ← R7 — Camino del Equipo
│               ├── final-battle/
│               │   ├── final-preparation/ ← R8 — Preparar Batalla Final
│               │   ├── final-battle/      ← R9 — Batalla Final (Grupal)
│               │   ├── live-events/       ← R10 — Eventos en Vivo
│               │   └── team-status/       ← R11 — Estado del Equipo
│               └── results/
│                   ├── awards/            ← R12 — Estadísticas y Premios
│                   └── history/           ← R13 — Historial
├── backend/
│   └── avengers-back/
│       └── src/
│           ├── basic/
│           ├── team/
│           ├── journey/
│           ├── final-battle/
│           └── results/
└── README.md
```

Cada funcionalidad sigue el patrón general de las referencias provistas:

```text
Angular:
model → service → component

NestJS:
controller → service
```

---

---

## Entregables

1. **Repositorio del grupo** con `avengers-front` y `avengers-back`.
2. **El proyecto debe instalar, compilar y ejecutarse correctamente** utilizando los comandos definidos por los proyectos.
3. **R1 — Héroes y R4 — Simular Batallas no deben modificarse.** Son las referencias de arquitectura provistas por la cátedra.
4. **Avengers Game API no debe modificarse.** El TP será evaluado utilizando la versión oficial provista por la cátedra.
5. **Cada integrante debe tener implementada, integrada y funcionando su funcionalidad individual asignada.**
6. **R9 — Batalla Final debe estar integrada y poder jugarse de principio a fin sin errores.** Es obligatoria para la aprobación del TP y responsabilidad de todo el grupo.
7. **Este README debe estar actualizado** con:
   - TEAM_ID / Team asignado.
   - Nombre del Tech Lead.
   - Nombre de los 10 integrantes.
   - Funcionalidad individual asignada a cada integrante.
8. El proyecto completo debe funcionar integrado contra **Avengers Game API**.

---

*Programación III — UTN — 2026*
