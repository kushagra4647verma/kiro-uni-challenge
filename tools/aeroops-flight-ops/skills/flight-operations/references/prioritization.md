# AeroOps Operational Prioritization

How AeroOps orders items so the most operationally urgent surface first. The
product principle is: critical information is prioritized (ordering and visual
weight). Implemented in `lib/domain/prioritization.ts`; reuse those functions.

## Severity ranking (single source of truth)

`SEVERITY_RANK` orders severities, higher = more urgent:

`CRITICAL` (4) > `HIGH` (3) > `MEDIUM` (2) > `LOW` (1)

- This is the one severity ordering in the project. Every consumer (incidents,
  flights, badges) uses it; do not define an alternate ranking.
- Defined in `lib/domain/prioritization.ts` as `SEVERITY_RANK`.

## Highest linked active incident (for a flight)

A flight's operative severity comes from its **highest-severity active linked
incident**, resolved by `highestSeverityActiveIncident`
(`lib/domain/incidentLinks.ts`):

- Considers only ids in the active-incident set; skips `RESOLVED` and dangling
  references without throwing.
- Returns `null` when the flight has no resolvable linked active incident.

## Disrupted-flight ordering

`sortDisruptedFlights` orders by these keys in precedence:

1. **Highest linked active-incident severity**, descending. A flight with no
   linked active incident ranks below any flight that has one.
2. **Disruption type** rank: `CANCELLED` > `DIVERTED` > `DELAYED`
   (`FLIGHT_DISRUPTION_RANK` = CANCELLED:3, DIVERTED:2, DELAYED:1).
3. **Longest delay duration** first.
4. **Deterministic tiebreaker**: ascending flight `id`.

## Incident ordering

`sortIncidents` orders by:

1. **Severity**, descending (via `SEVERITY_RANK`).
2. **More recently detected** first (`detectedAt` descending).
3. **Deterministic tiebreaker**: ascending incident `id`.

## Airport ordering (degraded first)

`sortAirports` places degraded hubs first:

1. Degraded rank: `CLOSED` > `MAJOR_DELAYS` > `MINOR_DELAYS` > `NORMAL`
   (`AIRPORT_DEGRADED_RANK`).
2. **Deterministic tiebreaker**: ascending airport `code`.

- A "degraded" airport is `MAJOR_DELAYS` or `CLOSED` (`isDegradedAirport`).

## Determinism

- All sort functions return a **new array** and do not mutate their input.
- Every ordering ends in an ascending id/code tiebreaker, so identical data
  always produces identical output (a total, stable, idempotent order).
- See `invariants.md` (P5–P8) for the formal guarantees the tests enforce.

## Authoritative sources
- `lib/domain/prioritization.ts` (`SEVERITY_RANK`, `FLIGHT_DISRUPTION_RANK`,
  `AIRPORT_DEGRADED_RANK`, `sortDisruptedFlights`, `sortIncidents`,
  `sortAirports`, `isDegradedAirport`)
- `lib/domain/incidentLinks.ts` (`highestSeverityActiveIncident`)
- `.kiro/specs/flight-operations-dashboard` (Requirement 4),
  `.kiro/specs/flight-disruption-intelligence`
