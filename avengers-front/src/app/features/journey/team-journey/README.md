# R7 — Camino del Equipo

Pantalla de solo lectura que muestra el recorrido cronológico del Player Team y el detalle de un encuentro.

## Endpoints del BFF

### `GET /journey/team/encounters`

Respuesta:

- `attemptId`: identificador del Journey actual.
- `playerTeamId`: Team configurado.
- `stops`: lista cronológica de paradas. Cada una incluye `kind` (`ENCOUNTER` o `FINAL`), `encounterId`, `stageId`, `stageCode`, `groupId`, `resolutionCode`, `opponentTeamId`, `opponentTeamName`, `outcome`, `damageDealt`, `rivalEncounter` y `finalStageStatus`.
- `progress`: `played`, `wins`, `draws`, `losses`.

`outcome` vale `WIN`, `DRAW`, `LOSS`, `PENDING` o `ABANDONED`. El stop `FINAL` tiene `encounterId:null` y usa `finalStageStatus` (`READY`, `ACTIVE` o `COMPLETED`).

### `GET /journey/team/encounters/:encounterId`

Devuelve el detalle del encuentro:

- `encounterId`, `stageId`, `stageCode`, `groupId`.
- `teamAId`, `teamBId`, `winnerTeamId`, `resolutionCode`, `rivalEncounter`, `outcome`, `damageDealt`.
- `rounds`: número, tipo, iniciativa, ganador, daño por Team, héroes activos y eventos.
- `extraRound`: round adicional o `null`.

## Estados de pantalla

- `loading`: consulta en curso.
- `empty` + `no-journey`: no existe Journey actual. La Game API responde **409 `JOURNEY_REQUIRED`** (o llega un 404); el BFF lo normaliza a **404 `BFF_TEAM_JOURNEY_UNAVAILABLE`** y se muestra el acceso a Simular Batallas.
- `empty` + `no-encounters`: hay Journey pero no hay encuentros del Player Team.
- `data`: lista de stops y detalle seleccionable.
- `error`: cualquier otro fallo; muestra mensaje y reintento.

Detalle: `idle` (sin selección), `loading`, `pending` (encuentro sin resultado), `unavailable` (detalle no disponible) y `error` (con reintento).

## Códigos de error

La decisión se toma por `messageCode`, nunca por el texto.

- **No hay Journey:** la Game API responde `409 JOURNEY_REQUIRED` (o un 404 upstream); el BFF devuelve `404 BFF_TEAM_JOURNEY_UNAVAILABLE`.
- **Error de consulta:** cualquier otro código, incluido `BFF_JOURNEY_UNAVAILABLE` → estado `error`, no `empty`.
- **Detalle no disponible:** la Game API responde `404` o `409 JOURNEY_REQUIRED`; el BFF devuelve `404 BFF_TEAM_JOURNEY_UNAVAILABLE` y el front usa `detailStatus='unavailable'`.
- **Error de detalle:** cualquier otro código → `detailStatus='error'` con reintento.

## Recursos de Game API

- `GET /game/teams/{teamId}/journeys/current`
- `GET /game/teams/{teamId}/journeys/current/teams`
- `GET /game/teams/{teamId}/journeys/current/encounters`
- `GET /game/teams/{teamId}/journeys/current/encounters/{encounterId}`
- `GET /game/heroes`
