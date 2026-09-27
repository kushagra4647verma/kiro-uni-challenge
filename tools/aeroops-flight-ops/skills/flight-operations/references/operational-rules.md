# AeroOps Operational Rules

The classification rules AeroOps uses. These are implemented as pure predicates
in `lib/domain/metrics.ts` and re-exported from `lib/domain/disruption.ts`.
Reuse those functions; the values below are for reasoning, and the code remains
authoritative.

## Active flight

A flight is **active** when its status is one of:
`SCHEDULED`, `BOARDING`, `DEPARTED`, `EN_ROUTE`, `DELAYED`, `DIVERTED`.

It is **not** active when `CANCELLED`, `LANDED`, or `ARRIVED`.

- Implemented by `isActive` / `ACTIVE_STATUSES` in `lib/domain/metrics.ts`.

## Delayed flight

A flight is **delayed** when either:
1. its status is `DELAYED`, or
2. its `estimatedDeparture` is **more than 15 minutes** after its
   `scheduledDeparture`.

- The threshold is the shared constant `DELAY_THRESHOLD_MINUTES` (= 15) in
  `lib/domain/metrics.ts`. Use the constant; never hard-code `15`.
- When `estimatedDeparture` is `null`, or a timestamp is unparseable, the
  threshold rule does not apply (the delay is not computable) — but a `DELAYED`
  status still classifies the flight as delayed.
- Implemented by `isDelayed`.

## Delay duration

The delay magnitude is the **whole-minute** difference
`estimatedDeparture − scheduledDeparture`.

- Returns `null` (not computable) when `estimatedDeparture` is `null` or a
  timestamp is unparseable — the calculation never throws.
- Implemented by `delayMinutes` in `lib/domain/format.ts`.
- "Not computable" is surfaced to users as an explicit value (e.g. "N/A"),
  consistent with the AeroOps principle that data is explicit, not ambiguous.

## Disrupted flight

A flight is **disrupted** when either:
1. its status is `DELAYED`, `CANCELLED`, or `DIVERTED`, or
2. it is linked to at least one **active incident**.

- Implemented by `isDisrupted` (with `hasActiveIncident`) in
  `lib/domain/metrics.ts`.
- Disruption is a superset of the delayed/cancelled/diverted statuses (see
  `invariants.md`, P4).

## Incident lifecycle and "active incident"

Incident status is one of `OPEN`, `MONITORING`, `RESOLVED`.

- An incident is **active** when its status is `OPEN` or `MONITORING`
  (i.e. not `RESOLVED`).
- Implemented by `isActiveIncident`; the set of active incident ids for a
  snapshot is built by `activeIncidentIdSet`.
- Only **active** incidents contribute to a flight's disruption and to the
  flight↔incident severity linkage. A link to a `RESOLVED` incident (or a
  dangling id) does not make a flight disrupted or critical.

## Notes

- These are the only classification rules AeroOps defines. There are no
  additional delay categories, no regulatory delay codes, and no maintenance or
  NOTAM-based statuses in the project. Do not add such concepts unless a future
  AeroOps spec introduces them.

## Authoritative sources
- `lib/domain/metrics.ts` (`isActive`, `isDelayed`, `isDisrupted`,
  `isActiveIncident`, `hasActiveIncident`, `activeIncidentIdSet`,
  `ACTIVE_STATUSES`, `DELAY_THRESHOLD_MINUTES`)
- `lib/domain/format.ts` (`delayMinutes`)
- `lib/domain/disruption.ts` (canonical re-export surface)
- `.kiro/specs/flight-operations-dashboard`, `.kiro/specs/flight-disruption-intelligence`
