# Requirements Document

## Introduction

AeroOps is an AI-powered Flight Operations and Incident Intelligence Platform for airline and airport operations teams. This spec defines the first feature: a **Flight Operations Dashboard** that lets an operations user immediately understand the current state of flight operations from a single screen.

The dashboard surfaces summary metrics, a prioritized list of disrupted flights, a prioritized list of recent operational incidents, and airport operational status. The goal is fast situational awareness: the items that most require operational attention appear first.

This first implementation is **frontend only**. It uses realistic mock data served through a data-source abstraction so the mock source can later be swapped for a FastAPI backend backed by MongoDB without changing UI components. The target stack is Next.js, TypeScript, and Tailwind CSS.

### Scope

- In scope: dashboard UI, summary metrics, disrupted-flight list, incident list, airport status, prioritization/sorting, loading and error states, a swappable mock data provider.
- Out of scope (this iteration): the FastAPI backend, MongoDB, authentication, write operations (creating/editing incidents), real-time streaming/websockets, historical analytics.

### Definitions

- **Active flight**: a flight whose status is one of `SCHEDULED`, `BOARDING`, `DEPARTED`, `EN_ROUTE`, `DELAYED`, or `DIVERTED` (i.e., not `CANCELLED`, `LANDED`, or `ARRIVED`).
- **Delayed flight**: a flight whose status is `DELAYED`, or whose estimated departure is later than its scheduled departure by more than 15 minutes.
- **Disrupted flight**: a flight whose status is `DELAYED`, `CANCELLED`, or `DIVERTED`, or that is linked to at least one active incident.
- **Active incident**: an incident whose status is `OPEN` or `MONITORING` (not `RESOLVED`).
- **Delay duration (minutes)**: `estimatedDeparture − scheduledDeparture`, in whole minutes, computed only when both timestamps exist; otherwise not applicable.
- **Severity**: one of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

---

## Requirements

### Requirement 1 — Dashboard summary metrics

**User Story:** As an operations user, I want a set of headline metrics at the top of the dashboard, so that I can gauge the overall state of operations at a glance.

#### Acceptance Criteria

1. WHEN the dashboard loads successfully THEN the system SHALL display a summary panel containing exactly these eight metrics: Total active flights, Delayed flights, Cancelled flights, Flights currently boarding, Flights with active incidents, Recent operational incidents (count), Disrupted flights (count), and Airport operational status.
2. WHERE a flight matches the "active flight" definition, the system SHALL include it in the Total active flights count.
3. WHERE a flight matches the "delayed flight" definition, the system SHALL include it in the Delayed flights count.
4. WHERE a flight has status `CANCELLED`, the system SHALL include it in the Cancelled flights count.
5. WHERE a flight has status `BOARDING`, the system SHALL include it in the Flights currently boarding count.
6. WHERE a flight is linked to at least one active incident, the system SHALL include it in the Flights with active incidents count.
7. WHEN a metric's computed value is zero THEN the system SHALL display the numeral `0` (not a blank, dash, or placeholder).
8. WHEN the underlying data changes and the dashboard re-renders THEN each metric value SHALL equal the count produced by applying its definition to the current dataset.

---

### Requirement 2 — Disrupted flights list

**User Story:** As an operations user, I want to see the flights that are disrupted with their key details, so that I can decide where to focus recovery efforts.

#### Acceptance Criteria

1. WHEN the dashboard loads successfully THEN the system SHALL display a list of disrupted flights, where each entry matches the "disrupted flight" definition.
2. WHEN a disrupted flight is displayed THEN the system SHALL show all of the following fields for it: flight number, airline, origin, destination, scheduled departure, estimated departure, current status, delay duration, incident type, and incident severity.
3. WHERE a flight has no linked incident, the system SHALL render the incident type and incident severity fields as an explicit "None" (not blank).
4. WHERE a flight's delay duration is not applicable (missing estimated or scheduled departure), the system SHALL render the delay duration field as "N/A".
5. WHEN a delay duration is applicable THEN the system SHALL display it as a human-readable duration (for example `1h 20m` or `45m`) computed from scheduled and estimated departure.
6. WHEN scheduled departure and estimated departure are displayed THEN the system SHALL format each as a locale-aware date-time and SHALL include a machine-readable ISO timestamp in the markup (for example via a `dateTime` / `data-*` attribute) for testability.
7. WHERE there are no disrupted flights, the system SHALL display an explicit empty-state message rather than an empty region.

---

### Requirement 3 — Recent operational incidents list

**User Story:** As an operations user, I want to see recent operational incidents with their details, so that I understand what is going wrong and what it affects.

#### Acceptance Criteria

1. WHEN the dashboard loads successfully THEN the system SHALL display a list of recent operational incidents.
2. WHEN an incident is displayed THEN the system SHALL show all of the following fields for it: incident title, type, severity, description, affected flights, affected airports, time detected, and current status.
3. WHERE an incident affects one or more flights, the system SHALL display the affected flight numbers; WHERE it affects none, the system SHALL display an explicit "None".
4. WHERE an incident affects one or more airports, the system SHALL display the affected airport codes; WHERE it affects none, the system SHALL display an explicit "None".
5. WHEN time detected is displayed THEN the system SHALL format it as a locale-aware date-time AND SHALL include a machine-readable ISO timestamp in the markup for testability.
6. WHERE there are no incidents, the system SHALL display an explicit empty-state message rather than an empty region.

---

### Requirement 4 — Prioritization of attention-critical items

**User Story:** As an operations user, I want the most critical incidents and flights shown first, so that I address the highest-impact problems without scanning the whole list.

#### Acceptance Criteria

1. WHEN the incidents list is rendered THEN the system SHALL order incidents by severity descending (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`), and WHERE two incidents share the same severity the system SHALL order the more recently detected one first.
2. WHEN the disrupted flights list is rendered THEN the system SHALL order flights by a priority key computed as: highest linked-incident severity first, then `CANCELLED` before `DIVERTED` before `DELAYED`, then longest delay duration first.
3. WHERE an item has severity `CRITICAL`, the system SHALL apply a distinct visual treatment (a dedicated CSS class or data attribute, for example `data-severity="CRITICAL"`) so that criticality is programmatically detectable, not conveyed by color alone.
4. WHEN two items are equal on all defined sort keys THEN the system SHALL apply a stable, deterministic tiebreaker (ascending by id) so that ordering does not change between renders of identical data.

---

### Requirement 5 — Airport operational status

**User Story:** As an operations user, I want to see the operational status of relevant airports, so that I know which hubs are constrained.

#### Acceptance Criteria

1. WHEN the dashboard loads successfully THEN the system SHALL display an airport operational status section listing each tracked airport.
2. WHEN an airport is displayed THEN the system SHALL show its airport code, name, and an operational status of one of `NORMAL`, `MINOR_DELAYS`, `MAJOR_DELAYS`, or `CLOSED`.
3. WHERE an airport status is `MAJOR_DELAYS` or `CLOSED`, the system SHALL mark it as programmatically detectable (a data attribute or dedicated class) so degraded hubs can be identified without relying on color.
4. WHEN more than one airport has a degraded status THEN the system SHALL order degraded airports (`CLOSED`, then `MAJOR_DELAYS`) before non-degraded ones.

---

### Requirement 6 — Swappable data source (mock now, backend later)

**User Story:** As a developer, I want the dashboard to read data through a single abstraction, so that I can replace mock data with a FastAPI + MongoDB backend later without rewriting UI components.

#### Acceptance Criteria

1. The system SHALL define a data-access interface (for example `DashboardDataSource`) that exposes the operations needed by the dashboard (for example `getDashboardSnapshot()`), and UI components SHALL depend only on this interface, not on any concrete implementation.
2. The system SHALL provide a mock implementation of the data-access interface that returns realistic in-memory data conforming to the shared TypeScript domain models.
3. The system SHALL allow selecting the active data source through a single configuration point (for example an environment variable or a provider factory) WITHOUT modifying UI components.
4. WHEN a future HTTP/FastAPI implementation of the interface is added THEN swapping to it SHALL require no changes to dashboard UI components, only to the configuration point.
5. The system SHALL define the domain models (Flight, Incident, Airport, DashboardSnapshot, and their enums) once in shared TypeScript types that both the mock source and any future backend adapter reuse.
6. The mock data SHALL include at least: 20 flights spanning every flight status, at least 5 incidents spanning every severity and at least one of each incident status, and at least 4 airports including at least one degraded (`MAJOR_DELAYS` or `CLOSED`) airport, so all UI states are exercisable.

---

### Requirement 7 — Loading, error, and empty states

**User Story:** As an operations user, I want the dashboard to clearly communicate when it is loading or something failed, so that I never mistake stale or empty UI for real operational data.

#### Acceptance Criteria

1. WHILE the dashboard data request is in progress THE system SHALL display a loading indicator for the affected region(s) and SHALL NOT display metric values.
2. IF the data request fails THEN the system SHALL display an error message that states data could not be loaded AND SHALL provide a retry affordance.
3. WHEN a retry is triggered after an error THEN the system SHALL re-request data and, on success, SHALL replace the error state with the loaded dashboard.
4. WHEN the request succeeds but returns no flights and no incidents THEN the system SHALL display the per-section empty states defined in Requirements 2 and 3 rather than an error.

---

### Requirement 8 — Technical foundation and testability

**User Story:** As a developer, I want the codebase structured and typed so requirements can be verified automatically, so that the dashboard's behavior is provable rather than asserted.

#### Acceptance Criteria

1. The system SHALL be implemented with Next.js (App Router), TypeScript in strict mode, and Tailwind CSS.
2. The system SHALL implement metric computation, prioritization, and delay-duration formatting as pure functions that are unit-testable independently of React components.
3. The system SHALL expose stable selectors on rendered items (for example `data-testid` on metric cards, flight rows, incident cards, and airport rows) so acceptance criteria can be asserted in automated tests.
4. WHEN the project's type check and lint run THEN they SHALL pass with no errors.
5. The system SHALL include automated unit tests for the pure functions in Acceptance Criterion 8.2 covering the counting definitions (Requirement 1), the ordering rules (Requirement 4), and delay formatting (Requirement 2).
