# Design Document

## Overview

Flight Disruption Intelligence formalizes the reusable core of AeroOps' flight operational rules. The seven required behaviors already exist as pure functions in the domain layer; this design gives them a **cohesive, documented surface**, extracts the one piece of disruption logic still buried in the view model, and pins the invariants with example-based and property-based tests — all without duplicating existing types or rules.

### Current state (what already exists — reuse, don't rebuild)

| Behavior | Existing implementation | Location |
|---|---|---|
| Active-flight classification | `isActive`, `ACTIVE_STATUSES` | `lib/domain/metrics.ts` |
| Delayed-flight classification | `isDelayed`, `DELAY_THRESHOLD_MINUTES` | `lib/domain/metrics.ts` |
| Delay-duration calculation | `delayMinutes` | `lib/domain/format.ts` |
| Disrupted-flight classification | `isDisrupted`, `hasActiveIncident`, `isActiveIncident`, `activeIncidentIdSet` | `lib/domain/metrics.ts` |
| Incident severity ranking | `SEVERITY_RANK` | `lib/domain/prioritization.ts` |
| Disrupted-flight prioritization | `sortDisruptedFlights`, `FLIGHT_DISRUPTION_RANK` | `lib/domain/prioritization.ts` |
| Deterministic ordering | id/localeCompare tiebreakers in all sorts | `lib/domain/prioritization.ts` |
| **Highest linked active incident** | `topIncidentForFlight` (**private helper**) | `lib/viewmodel/dashboardViewModel.ts` |

The only rule not yet shareable is `topIncidentForFlight`. Everything else is already pure and framework-free; this feature is a **thin consolidation** over proven code.

### Goal

A single, importable "disruption intelligence" surface in `lib/domain/` that:
- re-exposes the existing predicates/sorts as the canonical API (no reimplementation),
- promotes `topIncidentForFlight` from the view model into the domain layer,
- documents the invariants and backs them with property-based tests,
- lets the dashboard view model consume the extracted helper with zero behavior change.

---

## Design decisions

### 1. Consolidation surface, not a rewrite

Introduce one module, `lib/domain/disruption.ts`, that acts as the **named entry point** for disruption intelligence. It re-exports the existing, authoritative functions and hosts the newly-extracted helper. Re-exporting (rather than moving) keeps existing imports and the dashboard tests working, and avoids touching proven code.

```ts
// lib/domain/disruption.ts  (new — aggregation + one extracted helper)
export {
  isActive,
  isDelayed,
  isDisrupted,
  hasActiveIncident,
  isActiveIncident,
  activeIncidentIdSet,
  DELAY_THRESHOLD_MINUTES,
  ACTIVE_STATUSES,
} from "./metrics";

export { delayMinutes } from "./format";

export {
  SEVERITY_RANK,
  FLIGHT_DISRUPTION_RANK,
  sortDisruptedFlights,
  sortIncidents,
} from "./prioritization";

// Newly extracted from the view model (see decision 2):
export { highestSeverityActiveIncident } from "./incidentLinks";
```

Rationale: matches structure.md ("reusable framework-free logic lives in `lib/domain/`") and tech.md ("single source of truth"). No type or rule is duplicated — consumers get one obvious place to import disruption rules from.

### 2. Extract `topIncidentForFlight` into the domain layer

Move the private helper out of `dashboardViewModel.ts` into a small pure module and generalize its name.

```ts
// lib/domain/incidentLinks.ts  (new)
import type { Flight, Incident } from "./types";
import { SEVERITY_RANK } from "./prioritization";

/**
 * The highest-severity active incident linked to a flight, or null.
 * Ignores resolved incidents and dangling references without throwing.
 */
export function highestSeverityActiveIncident(
  flight: Flight,
  incidentsById: ReadonlyMap<string, Incident>,
  activeIncidentIds: ReadonlySet<string>,
): Incident | null;
```

This is behavior-identical to the current `topIncidentForFlight` (same severity comparison via `SEVERITY_RANK`, same skip-resolved/skip-missing logic). The view model then imports it instead of defining it inline. This is the one **behavior-preserving refactor** in the feature (Req 5.3, 8.3).

Rationale: the rule "which incident makes this flight critical" is domain intelligence, not view composition. Placing it in `lib/domain/` makes it reusable by alerts, the future backend, etc.

### 3. Leave rule semantics untouched

No thresholds, rankings, status sets, or tiebreakers change value. `DELAY_THRESHOLD_MINUTES` stays 15; `SEVERITY_RANK` stays `LOW:1..CRITICAL:4`; `FLIGHT_DISRUPTION_RANK` stays `CANCELLED:3 > DIVERTED:2 > DELAYED:1`; tiebreak stays ascending id via `localeCompare`. The feature's value is consolidation + proof, per the "MVP / no speculative change" steering.

---

## Module layout

```
lib/domain/
  types.ts             # unchanged — single source of truth for types
  metrics.ts           # unchanged — active/delayed/disrupted predicates
  format.ts            # unchanged — delayMinutes
  prioritization.ts    # unchanged — SEVERITY_RANK, sorts, tiebreakers
  incidentLinks.ts     # NEW — highestSeverityActiveIncident (extracted)
  disruption.ts        # NEW — canonical re-export surface for the feature
lib/viewmodel/
  dashboardViewModel.ts# EDIT — import highestSeverityActiveIncident instead of inline helper
tests/
  disruption.property.test.ts  # NEW — property-based invariants (P1–P8)
  incidentLinks.test.ts        # NEW — example-based tests for the extracted helper
```

Only two existing lines of behavior move (the helper); everything else is additive.

---

## Data and types

No new domain types. The feature operates entirely on the existing `Flight`, `Incident`, `Severity`, `FlightStatus`, and the derived `DisruptedFlightVM` (used by `sortDisruptedFlights`). Inputs are plain domain values and lookup structures (`ReadonlyMap`/`ReadonlySet`), keeping the surface free of any data-source or environment dependency (Req 8.4).

---

## Behavior-to-requirement mapping

| Requirement | Surface element | Note |
|---|---|---|
| 1 Active | `isActive` / `ACTIVE_STATUSES` | reused |
| 2 Delayed | `isDelayed` / `DELAY_THRESHOLD_MINUTES` | reused |
| 3 Delay duration | `delayMinutes` | reused |
| 4 Disrupted | `isDisrupted` / `hasActiveIncident` / `activeIncidentIdSet` | reused |
| 5 Severity prioritization | `SEVERITY_RANK` + `highestSeverityActiveIncident` | ranking reused; helper extracted |
| 6 Disrupted-flight prioritization | `sortDisruptedFlights` | reused |
| 7 Deterministic ordering | tiebreakers in `sortDisruptedFlights` / `sortIncidents` | reused |

---

## Testing Strategy

Two layers, matching tech.md ("write tests for business logic") and the existing node-environment Vitest setup (`tests/**/*.test.ts`).

### Example-based (mirrors existing style)
- `incidentLinks.test.ts`: highest-severity resolution picks CRITICAL over HIGH; skips resolved incidents; ignores dangling ids; returns null when no active linked incident. Confirms parity with prior `topIncidentForFlight` behavior.
- Existing `metrics.test.ts` and `prioritization.test.ts` already cover the reused predicates/sorts and MUST keep passing (regression guard for the extraction).

### Property-based (new — the invariants)
A property-testing dev dependency (e.g. `fast-check`) generates randomized valid domain values via small **arbitraries** (random `Flight`/`Incident` with valid enums and ISO timestamps). If adopted, it is dev-only and does not touch application code (Req 9.4). Properties:

| ID | Property | Function under test |
|---|---|---|
| P1 | `isActive(f)` ⇔ status ∉ {CANCELLED, LANDED, ARRIVED} | `isActive` |
| P2 | For non-DELAYED flights, `isDelayed` is monotonic in estimated departure and flips exactly at >15m | `isDelayed` |
| P3 | `delayMinutes` = rounded diff when computable; null exactly when estimated null / timestamp invalid | `delayMinutes` |
| P4 | delayed ∨ cancelled ∨ diverted ⟹ disrupted | `isDisrupted` |
| P5 | `SEVERITY_RANK` is a strict total order CRITICAL>HIGH>MEDIUM>LOW | `SEVERITY_RANK` |
| P6 | ordering is transitive + antisymmetric (id tiebreak) + idempotent | `sortDisruptedFlights`, `sortIncidents` |
| P7 | permuting the input yields the same ordered output | `sortDisruptedFlights`, `sortIncidents` |
| P8 | inputs are never mutated (deep-equal before/after) | all predicates + sorts |

Property tests assert the *general* rules; example tests pin concrete edge cases. Together they prove the consolidation is behavior-preserving.

### Static gates
- `tsc --noEmit` (strict), `next lint`, and `vitest run` all pass; pre-existing tests unchanged (Req 9.5).

---

## Risks and mitigations

- **Risk:** extracting the helper subtly changes ordering. **Mitigation:** identical comparison logic + existing prioritization tests as regression guard + P6/P7 properties.
- **Risk:** a new dev dependency conflicts with "avoid unnecessary dependencies." **Mitigation:** property testing is the point of Req 9; keep it dev-only and minimal, or fall back to a small hand-rolled generator if a dependency is not desired. Confirm with the team during implementation.
- **Risk:** re-export surface drift (two ways to import the same rule). **Mitigation:** `disruption.ts` re-exports rather than reimplements; the originals remain the definitions.
