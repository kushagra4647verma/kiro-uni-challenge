# Implementation Plan

This feature consolidates existing, proven flight rules into a reusable domain surface and proves the invariants. Reuse existing functions and types — do not reimplement rules or duplicate types. The only behavior move is extracting one view-model helper. Keep every module framework-independent (no React/Next imports).

- [ ] 1. Extract the highest-severity-linked-incident helper into the domain layer
  - Create `lib/domain/incidentLinks.ts` exporting a pure `highestSeverityActiveIncident(flight, incidentsById, activeIncidentIds)` that returns the highest-severity active linked incident or null, reusing `SEVERITY_RANK` and ignoring resolved/dangling references without throwing.
  - Keep the comparison logic identical to the current `topIncidentForFlight` so behavior is preserved.
  - _Requirements: 5.3, 5.4, 8.1, 8.2_

- [ ] 2. Point the dashboard view model at the extracted helper (behavior-preserving)
  - Update `lib/viewmodel/dashboardViewModel.ts` to import `highestSeverityActiveIncident` and remove the inline private `topIncidentForFlight`, leaving all outputs identical.
  - Do not change any rule, ordering, or produced view-model values.
  - _Requirements: 8.3_

- [ ] 3. Create the canonical disruption-intelligence surface
  - Create `lib/domain/disruption.ts` that re-exports the existing authoritative functions/constants (`isActive`, `isDelayed`, `isDisrupted`, `hasActiveIncident`, `isActiveIncident`, `activeIncidentIdSet`, `ACTIVE_STATUSES`, `DELAY_THRESHOLD_MINUTES` from metrics; `delayMinutes` from format; `SEVERITY_RANK`, `FLIGHT_DISRUPTION_RANK`, `sortDisruptedFlights`, `sortIncidents` from prioritization) plus `highestSeverityActiveIncident`.
  - Re-export only; do not redefine any rule or type. This module is the single import point for the feature.
  - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.2, 6.3, 8.1, 8.2_

- [ ] 4. Add example-based tests for the extracted helper
  - Create `tests/incidentLinks.test.ts` asserting: highest severity wins (CRITICAL over HIGH), resolved incidents are skipped, dangling ids are ignored, and null is returned when no active linked incident exists.
  - _Requirements: 5.3, 5.4, 9.1_

- [ ] 5. Introduce property-based testing capability
  - Add a dev-only property-testing tool (e.g. `fast-check`) OR a minimal hand-rolled generator if a new dependency is not desired; confirm the choice against tech.md before adding.
  - Provide small arbitraries/generators for valid `Flight` and `Incident` values (valid enums, ISO timestamps, nullable estimated departure).
  - _Requirements: 9.2, 9.4_

- [ ] 6. Write property-based tests for the invariants
  - Create `tests/disruption.property.test.ts` covering P1–P8 from the requirements: active-set exclusivity, delay monotonicity + threshold flip, delay-duration consistency/null cases, disruption superset, severity total order, ordering total-preorder + idempotence, permutation invariance, and no-mutation.
  - _Requirements: 7.2, 7.3, 7.4, 9.2, 9.3_

- [ ] 7. Verify no regression and pass static gates
  - Run the full suite: new tests plus pre-existing `metrics.test.ts`, `prioritization.test.ts`, `format.test.ts`, `mockData.test.ts` must all pass (regression guard for the extraction).
  - Run `npm run type-check` (strict) and `npm run lint` with no errors; confirm no module in `lib/domain/` imports React/Next.
  - _Requirements: 8.1, 9.5_
