# Implementation Plan

Incremental, test-driven build order. Each task is self-contained, produces verifiable output, and cites the requirements it satisfies. Domain logic and data contract come first (they are pure and independently testable), then the mock source, then presentation, then wiring and gates. Do not build the FastAPI backend in this iteration.

- [ ] 1. Scaffold the Next.js + TypeScript + Tailwind project and tooling
  - Initialize a Next.js App Router project with TypeScript strict mode enabled in `tsconfig.json`.
  - Configure Tailwind CSS (`tailwind.config`, `globals.css` with directives) and confirm it applies.
  - Add and configure Vitest with a TS-native setup; add `test`, `type-check` (`tsc --noEmit`), and `lint` scripts.
  - Create the folder skeleton: `app/`, `components/dashboard/`, `lib/domain/`, `lib/data/mock/`, `lib/viewmodel/`, `tests/`.
  - _Requirements: 8.1, 8.4_

- [ ] 2. Define shared domain models and enums
  - Implement `lib/domain/types.ts` with `FlightStatus`, `IncidentType`, `Severity`, `IncidentStatus`, `AirportOpStatus` enums/unions and the `Airport`, `Flight`, `Incident`, `DashboardSnapshot`, `DashboardMetrics`, `DisruptedFlightVM`, `DashboardViewModel` interfaces exactly as in the design.
  - Ensure timestamps are ISO 8601 strings and `estimatedDeparture` is nullable.
  - _Requirements: 6.5_

- [ ] 3. Implement and unit-test formatting utilities
  - Implement `lib/domain/format.ts`: `delayMinutes`, `formatDelay` (`75 → "1h 20m"`, `45 → "45m"`, `0 → "0m"`, `null → "N/A"`), `toIsoAttr`, `formatDateTime`.
  - Write `tests/format.test.ts` covering all `formatDelay` cases and `delayMinutes` with null estimated → null.
  - _Requirements: 2.4, 2.5, 2.6, 3.5, 8.2, 8.5_

- [ ] 4. Implement and unit-test metric computation
  - Implement `lib/domain/metrics.ts`: predicates (`isActive`, `isDelayed` including the >15-minute rule, `isCancelled`, `isBoarding`, `hasActiveIncident`, `isDisrupted`, `isActiveIncident`) and `computeMetrics(snapshot)`.
  - Build the active-incident id set once; ensure zero counts return `0`.
  - Write `tests/metrics.test.ts` with a fixture of known composition asserting every count and the zero-count behavior.
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 8.2, 8.5_

- [ ] 5. Implement and unit-test prioritization/sorting
  - Implement `lib/domain/prioritization.ts`: `SEVERITY_RANK`, `sortIncidents`, `sortDisruptedFlights`, `sortAirports`. All return new arrays (no mutation) and end with an ascending id/code tiebreaker.
  - Write `tests/prioritization.test.ts` asserting incident order (severity desc, detectedAt desc, id asc), disrupted-flight order (top incident severity → CANCELLED>DIVERTED>DELAYED → delay desc → id asc), airport degraded-first order, and stability on equal keys.
  - _Requirements: 4.1, 4.2, 4.4, 5.4, 8.2, 8.5_

- [ ] 6. Compose the dashboard view model
  - Implement `lib/viewmodel/dashboardViewModel.ts`: `buildDashboardViewModel(snapshot)` that computes metrics, derives `DisruptedFlightVM`s (resolving each flight's highest-severity linked incident for `topIncidentType`/`topIncidentSeverity`, and delay label), filters incidents to active and sorts them, and sorts airports.
  - Defensively ignore dangling incident/flight/airport references (do not throw) per the error-handling table.
  - _Requirements: 2.1, 2.3, 3.1, 4.1, 4.2, 5.4_

- [ ] 7. Define the data-source interface and mock implementation
  - Implement `lib/data/DashboardDataSource.ts` with the `getDashboardSnapshot(): Promise<DashboardSnapshot>` interface.
  - Implement `lib/data/mock/mockData.ts` (`buildMockSnapshot()`) with a realistic dataset: ≥20 flights spanning every `FlightStatus`, ≥5 incidents spanning every `Severity` and including each `IncidentStatus`, ≥4 airports with ≥1 degraded; timestamps relative to "now"; internally consistent links; return a deep clone.
  - Implement `lib/data/mock/MockDashboardDataSource.ts` implementing the interface.
  - Write `tests/mockData.test.ts` asserting the coverage counts and referential integrity from the design.
  - _Requirements: 6.1, 6.2, 6.6_

- [ ] 8. Implement the single data-source configuration point
  - Implement `lib/data/getDataSource.ts` factory selecting the source via `NEXT_PUBLIC_DATA_SOURCE` (default `mock`), with a documented `http` branch stub for the future FastAPI adapter — no UI component references a concrete source.
  - Add the future `HttpDashboardDataSource` as documented-but-inert (commented or throwing "not implemented") so the swap boundary is explicit.
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 9. Build shared presentation primitives
  - Implement `SeverityBadge.tsx` (renders text label + `data-severity`, not color-only), `StatusBadge.tsx`, and `EmptyState.tsx` (explicit message + `data-testid="empty-{section}"`).
  - _Requirements: 4.3, 5.3, 2.7, 3.6, 7.4_

- [ ] 10. Build the summary metrics panel
  - Implement `SummaryMetrics.tsx` and `MetricCard.tsx` rendering all eight metrics with `data-testid="metric-{key}"`; show `0` for zero values.
  - _Requirements: 1.1, 1.7_

- [ ] 11. Build the disrupted flights list
  - Implement `DisruptedFlightList.tsx` (consumes pre-sorted VM, renders `EmptyState` when empty) and `FlightRow.tsx` rendering all ten fields: flight number, airline, origin, destination, scheduled departure, estimated departure, current status, delay duration, incident type, incident severity.
  - Render "None" for missing incident type/severity, "N/A" for inapplicable delay, `<time dateTime={iso}>` for both departure times, and `data-severity` for critical rows; `data-testid="flight-row-{id}"`.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.2, 4.3_

- [ ] 12. Build the incidents list
  - Implement `IncidentList.tsx` (pre-sorted, `EmptyState` when empty) and `IncidentCard.tsx` rendering all eight fields: title, type, severity, description, affected flights, affected airports, time detected, current status.
  - Render affected flight numbers / airport codes or "None"; `<time dateTime={iso}>` for detectedAt; `data-severity` for critical; `data-testid="incident-card-{id}"`.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.3_

- [ ] 13. Build the airport operational status section
  - Implement `AirportStatusList.tsx` rendering each airport's code, name, and status, ordered degraded-first, with `data-degraded` on `MAJOR_DELAYS`/`CLOSED` rows; `data-testid="airport-status"`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 14. Wire the dashboard page with loading and error states
  - Implement `app/page.tsx` as a server component that calls `getDataSource().getDashboardSnapshot()`, builds the view model, and renders all sections in a single-glance layout.
  - Implement `app/loading.tsx` (Suspense skeleton, no metric values shown during load) and `app/error.tsx` (client component with error message + Retry that re-runs the fetch).
  - Ensure an all-empty snapshot renders per-section empty states rather than an error.
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

- [ ] 15. Final verification and static gates
  - Run the unit test suite (metrics, prioritization, format, mockData) and ensure all pass.
  - Run `tsc --noEmit` (strict) and ESLint; resolve all errors.
  - Manually confirm each dashboard section renders with mock data and that degraded/critical items sort first.
  - _Requirements: 8.3, 8.4, 8.5_
