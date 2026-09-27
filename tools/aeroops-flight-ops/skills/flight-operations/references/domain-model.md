# AeroOps Domain Model

The AeroOps domain entities and enumerations. All shapes are defined once in
`lib/domain/types.ts` as the single source of truth; display wording is in
`lib/domain/labels.ts`. This reference summarizes them for reasoning — consult
those files for exact definitions before changing anything.

## Enumerations

### Flight status (`FlightStatus`)
`SCHEDULED`, `BOARDING`, `DEPARTED`, `EN_ROUTE`, `DELAYED`, `DIVERTED`,
`CANCELLED`, `LANDED`, `ARRIVED`.

### Incident type (`IncidentType`)
`WEATHER`, `TECHNICAL`, `SECURITY`, `CREW`, `ATC`, `MEDICAL`, `GROUND_OPS`,
`OTHER`. These are AeroOps' own coarse categories; they are not tied to any
external regulatory taxonomy.

### Severity (`Severity`)
`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### Incident status (`IncidentStatus`)
`OPEN`, `MONITORING`, `RESOLVED`.

### Airport operational status (`AirportOpStatus`)
`NORMAL`, `MINOR_DELAYS`, `MAJOR_DELAYS`, `CLOSED`.

## Entities

### Airport
- `code` (IATA, e.g. `"JFK"`), `name`, `status` (`AirportOpStatus`).

### Flight
- `id`, `flightNumber` (e.g. `"AA123"`), `airline`, `origin`, `destination`
  (origin/destination are airport codes).
- `scheduledDeparture` (ISO 8601), `estimatedDeparture` (ISO 8601 or `null`
  when unknown).
- `status` (`FlightStatus`).
- `incidentIds` (0..n references to `Incident.id`).

### Incident
- `id`, `title`, `type` (`IncidentType`), `severity` (`Severity`),
  `status` (`IncidentStatus`), `description`.
- `affectedFlightIds` (references to `Flight.id`),
  `affectedAirportCodes` (references to `Airport.code`).
- `detectedAt` (ISO 8601).

### DashboardSnapshot
The single aggregated read payload: `flights`, `incidents`, `airports`, and
`generatedAt` (ISO 8601). This is the contract a data source returns; the same
shape is intended for a future FastAPI + MongoDB backend.

## Terminology conventions

- **Timestamps** are ISO 8601 strings (JSON/HTTP- and MongoDB-friendly).
  `estimatedDeparture` is nullable; all other timestamps are present.
- **Relationships are id-based**: flights reference incidents by id and vice
  versa. References may dangle (point at a missing/other-scope entity); domain
  code tolerates this rather than assuming integrity (see `invariants.md`).
- **Display labels** (e.g. `EN_ROUTE` → "En route", `GROUND_OPS` → "Ground ops")
  come from `lib/domain/labels.ts`; do not hard-code display strings elsewhere.
- **Derived view shapes** (`DashboardMetrics`, `DisruptedFlightVM`,
  `DashboardViewModel`) are computed, never stored; they also live in
  `types.ts`.

## Authoritative sources
- `lib/domain/types.ts` (entities, enums, derived view types)
- `lib/domain/labels.ts` (display terminology)
- `.kiro/specs/flight-operations-dashboard` (originating definitions)
