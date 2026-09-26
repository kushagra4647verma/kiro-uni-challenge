# Design Document

## Overview

The Flight Operations Dashboard is a Next.js (App Router) + TypeScript + Tailwind CSS frontend that renders a single situational-awareness screen for airline/airport operations teams. It reads a single aggregated payload — a `DashboardSnapshot` — through a `DashboardDataSource` interface. In this iteration the interface is backed by an in-memory mock; a later iteration swaps in an HTTP adapter to a FastAPI + MongoDB backend with **no changes to UI components**.

The design isolates three concerns:

1. **Domain + logic (pure, framework-free):** shared TypeScript types plus pure functions for metric computation, prioritization/sorting, and formatting. Independently unit-testable (Req 8.2).
2. **Data access (swappable):** the `DashboardDataSource` interface, a mock implementation, and a single factory/config point that selects the active source (Req 6).
3. **Presentation (React/Tailwind):** server and client components that consume the snapshot and render metrics, lists, and states.

### Design goals mapped to requirements

- Single-glance situational awareness → Req 1 (metrics), Req 5 (airports).
- Attention-first ordering → Req 4 (prioritization), implemented as pure sort functions.
- Backend swap without UI churn → Req 6 (data-source abstraction + shared types).
- Provable behavior → Req 8 (pure functions, `data-testid`, unit tests).

---

## Architecture

### High-level flow

```
                ┌──────────────────────────────────────────────┐
                │  Presentation (React Server/Client Components) │
                │  DashboardPage → SummaryMetrics, IncidentList, │
                │  DisruptedFlightList, AirportStatusList,       │
                │  Loading / Error / Empty states                │
                └───────────────▲───────────────┬───────────────┘
                                │ snapshot        │ derived view models
                                │                 ▼
                ┌───────────────┴───────────────────────────────┐
                │  Domain logic (pure, framework-free)           │
                │  metrics.ts · prioritization.ts · format.ts    │
                └───────────────▲────────────────────────────────┘
                                │ DashboardSnapshot (typed)
                ┌───────────────┴────────────────────────────────┐
                │  Data access (swappable)                        │
                │  DashboardDataSource (interface)                │
                │  ├─ MockDashboardDataSource  (this iteration)   │
                │  └─ HttpDashboardDataSource  (future: FastAPI)  │
                │  getDataSource() ← single config point          │
                └─────────────────────────────────────────────────┘
```

### Why fetch a single `DashboardSnapshot`

The dashboard is a read-only aggregate view. Modeling the data contract as one `getDashboardSnapshot()` call (rather than separate `getFlights` / `getIncidents` calls) means the future FastAPI backend can expose a single `GET /api/dashboard/snapshot` endpoint that MongoDB aggregates server-side. This keeps the client simple and the swap boundary narrow. The interface can still grow additional methods later without breaking existing UI.

### Rendering strategy

- The dashboard is rendered by a **server component** (`app/page.tsx`) that awaits `getDataSource().getDashboardSnapshot()`. This works identically for the mock (in-memory) and the future HTTP source (server-side fetch), keeping data access off the client.
- A thin **client component** wrapper handles the retry interaction (Req 7.2–7.3). Retry is implemented via `router.refresh()` and an error boundary, so the same server data path is re-exercised.
- Because the mock is synchronous/in-memory, loading state is brief; the loading UI (Req 7.1) is implemented with Next.js `loading.tsx` (Suspense) so it is real and testable, and remains correct once the HTTP source introduces genuine latency.

### Project structure

```
app/
  layout.tsx                 # root layout, Tailwind globals
  page.tsx                   # server component: fetch snapshot, render dashboard
  loading.tsx                # Suspense loading UI (Req 7.1)
  error.tsx                  # error boundary + retry (Req 7.2, 7.3)
  globals.css                # Tailwind directives
components/
  dashboard/
    SummaryMetrics.tsx       # Req 1
    MetricCard.tsx
    DisruptedFlightList.tsx  # Req 2, Req 4.2
    FlightRow.tsx
    IncidentList.tsx         # Req 3, Req 4.1
    IncidentCard.tsx
    AirportStatusList.tsx    # Req 5
    SeverityBadge.tsx        # Req 4.3 (programmatic severity marker)
    StatusBadge.tsx
    EmptyState.tsx           # Req 2.7, 3.6, 7.4
lib/
  domain/
    types.ts                 # shared domain models + enums (Req 6.5)
    metrics.ts               # pure metric computation (Req 1, 8.2)
    prioritization.ts        # pure sorting/priority keys (Req 4, 8.2)
    format.ts                # delay + datetime formatting (Req 2.5, 2.6, 8.2)
  data/
    DashboardDataSource.ts   # interface (Req 6.1)
    mock/
      MockDashboardDataSource.ts   # Req 6.2
      mockData.ts                  # realistic dataset (Req 6.6)
    getDataSource.ts         # single config point / factory (Req 6.3, 6.4)
  viewmodel/
    dashboardViewModel.ts    # snapshot → derived VM (metrics + sorted lists)
tests/
  metrics.test.ts
  prioritization.test.ts
  format.test.ts
```

UI components import from `lib/domain` and `lib/viewmodel` only. They never import a concrete data source (Req 6.1).

---

## Data Models

Defined once in `lib/domain/types.ts` and reused by the mock source and any future backend adapter (Req 6.5). Timestamps are ISO 8601 strings (serialization-friendly for a JSON/HTTP backend and Mongo-compatible).

### Enums

```ts
export type FlightStatus =
  | "SCHEDULED" | "BOARDING" | "DEPARTED" | "EN_ROUTE"
  | "DELAYED"  | "DIVERTED" | "CANCELLED" | "LANDED" | "ARRIVED";

export type IncidentType =
  | "WEATHER" | "TECHNICAL" | "SECURITY" | "CREW"
  | "ATC" | "MEDICAL" | "GROUND_OPS" | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus = "OPEN" | "MONITORING" | "RESOLVED";

export type AirportOpStatus =
  | "NORMAL" | "MINOR_DELAYS" | "MAJOR_DELAYS" | "CLOSED";
```

### Core entities

```ts
export interface Airport {
  code: string;          // IATA, e.g. "JFK"
  name: string;
  status: AirportOpStatus;
}

export interface Flight {
  id: string;
  flightNumber: string;          // e.g. "AA123"
  airline: string;
  origin: string;                // airport code
  destination: string;           // airport code
  scheduledDeparture: string;    // ISO 8601
  estimatedDeparture: string | null; // ISO 8601 or null
  status: FlightStatus;
  incidentIds: string[];         // links to Incident.id (0..n)
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  affectedFlightIds: string[];   // Flight.id references
  affectedAirportCodes: string[];// Airport.code references
  detectedAt: string;            // ISO 8601
}

export interface DashboardSnapshot {
  flights: Flight[];
  incidents: Incident[];
  airports: Airport[];
  generatedAt: string;           // ISO 8601 — when the snapshot was produced
}
```

### Derived view model (not stored, computed by pure functions)

```ts
export interface DashboardMetrics {
  totalActiveFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  boardingFlights: number;
  flightsWithActiveIncidents: number;
  recentIncidents: number;
  disruptedFlights: number;
}

export interface DisruptedFlightVM {
  flight: Flight;
  delayMinutes: number | null;      // null => "N/A" (Req 2.4)
  delayLabel: string;               // "1h 20m" | "45m" | "N/A"
  topIncidentType: IncidentType | null;   // null => "None" (Req 2.3)
  topIncidentSeverity: Severity | null;    // null => "None"
  priorityKey: number;              // for deterministic sorting (Req 4.2)
}

export interface DashboardViewModel {
  metrics: DashboardMetrics;
  disruptedFlights: DisruptedFlightVM[];  // pre-sorted (Req 4.2)
  incidents: Incident[];                  // active, pre-sorted (Req 4.1)
  airports: Airport[];                    // pre-sorted, degraded first (Req 5.4)
}
```

---

## Domain Logic (pure functions)

All functions are pure, deterministic, and framework-free so they can be unit-tested directly (Req 8.2, 8.5).

### `metrics.ts` — counting (Req 1)

Each definition from the requirements becomes a small predicate + count. Predicates are exported for reuse in filtering.

```ts
const ACTIVE_STATUSES: FlightStatus[] =
  ["SCHEDULED","BOARDING","DEPARTED","EN_ROUTE","DELAYED","DIVERTED"];

export function isActive(f: Flight): boolean;         // status ∈ ACTIVE_STATUSES
export function isDelayed(f: Flight): boolean;        // DELAYED, or estDep − schedDep > 15m
export function isCancelled(f: Flight): boolean;      // status === "CANCELLED"
export function isBoarding(f: Flight): boolean;       // status === "BOARDING"
export function hasActiveIncident(f: Flight, activeIncidentIds: Set<string>): boolean;
export function isDisrupted(f: Flight, activeIncidentIds: Set<string>): boolean;
export function isActiveIncident(i: Incident): boolean; // OPEN | MONITORING

export function computeMetrics(snapshot: DashboardSnapshot): DashboardMetrics;
```

`computeMetrics` builds the set of active-incident ids once, then applies predicates. Zero counts return `0` (Req 1.7). This directly satisfies Req 1.2–1.6 and Req 8.2.

### `prioritization.ts` — ordering (Req 4)

```ts
export const SEVERITY_RANK: Record<Severity, number> =
  { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

const FLIGHT_DISRUPTION_RANK = { CANCELLED: 3, DIVERTED: 2, DELAYED: 1 };

// Incidents: severity desc, then detectedAt desc, then id asc (stable tiebreaker)
export function sortIncidents(incidents: Incident[]): Incident[];

// Disrupted flights: top linked-incident severity desc, then disruption-type rank
// (CANCELLED>DIVERTED>DELAYED), then delayMinutes desc, then id asc
export function sortDisruptedFlights(vms: DisruptedFlightVM[]): DisruptedFlightVM[];

// Airports: degraded first (CLOSED, then MAJOR_DELAYS), then others; stable by code
export function sortAirports(airports: Airport[]): Airport[];
```

Sorts return **new arrays** (no mutation) and always end with an ascending-id/code tiebreaker so identical data renders identically (Req 4.4). `SEVERITY_RANK` is the single source of truth for severity ordering, shared with badges.

### `format.ts` — formatting (Req 2.5, 2.6, 3.5)

```ts
export function delayMinutes(scheduled: string, estimated: string | null): number | null;
export function formatDelay(minutes: number | null): string; // "1h 20m" | "45m" | "N/A"
export function toIsoAttr(iso: string): string;               // machine-readable for markup
export function formatDateTime(iso: string, locale?: string): string; // locale-aware display
```

`formatDelay(null)` → `"N/A"` (Req 2.4). Negative or zero minutes are formatted as `"0m"`; the "delayed" threshold logic lives in `metrics.ts`, not here.

### `dashboardViewModel.ts` — composition

`buildDashboardViewModel(snapshot)` composes the above: computes metrics, derives `DisruptedFlightVM`s (resolving each flight's highest-severity linked incident for `topIncidentType`/`topIncidentSeverity`), filters incidents to active ones and sorts them, and sorts airports. UI consumes only this view model.

---

## Data Access Layer (swappable) — Req 6

### Interface

```ts
// lib/data/DashboardDataSource.ts
export interface DashboardDataSource {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
}
```

Async by design: the mock resolves immediately, the future HTTP source awaits `fetch`. UI/view-model code awaits the same promise either way.

### Mock implementation

```ts
// lib/data/mock/MockDashboardDataSource.ts
export class MockDashboardDataSource implements DashboardDataSource {
  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    return buildMockSnapshot(); // deep-cloned so callers can't mutate the fixture
  }
}
```

`mockData.ts` provides a realistic dataset satisfying Req 6.6: ≥20 flights covering every `FlightStatus`; ≥5 incidents covering every `Severity` and at least one of each `IncidentStatus`; ≥4 airports including at least one degraded. `generatedAt` and timestamps are computed relative to "now" at call time so delays and "recent" ordering look realistic on every load. Flight↔incident links are internally consistent (every `affectedFlightId` and `incidentId` resolves).

### Configuration point (single swap boundary)

```ts
// lib/data/getDataSource.ts
export function getDataSource(): DashboardDataSource {
  const kind = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";
  switch (kind) {
    case "http":  return new HttpDashboardDataSource(process.env.API_BASE_URL!); // future
    case "mock":
    default:      return new MockDashboardDataSource();
  }
}
```

Only this file changes when the backend arrives (Req 6.3, 6.4). UI components call `getDataSource()` (or receive the snapshot via props from the page) and never name a concrete class.

### Future FastAPI + MongoDB adapter (documented, not built now)

```ts
// lib/data/http/HttpDashboardDataSource.ts  (future)
export class HttpDashboardDataSource implements DashboardDataSource {
  constructor(private baseUrl: string) {}
  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const res = await fetch(`${this.baseUrl}/api/dashboard/snapshot`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Snapshot request failed: ${res.status}`);
    return (await res.json()) as DashboardSnapshot;
  }
}
```

The FastAPI side will expose `GET /api/dashboard/snapshot` returning JSON that matches `DashboardSnapshot`. MongoDB collections map directly: `flights`, `incidents`, `airports`; the endpoint aggregates them and computes `generatedAt`. Because the JSON contract equals the shared TypeScript model, the swap is config-only.

---

## Presentation Layer

### Component responsibilities

| Component | Requirement | Key `data-testid` | Notes |
|---|---|---|---|
| `SummaryMetrics` | Req 1 | `summary-metrics` | Renders 8 `MetricCard`s |
| `MetricCard` | Req 1.7 | `metric-{key}` | Shows label + numeric value (`0` when zero) |
| `DisruptedFlightList` | Req 2, 4.2 | `disrupted-flights` | Sorted list or `EmptyState` |
| `FlightRow` | Req 2.2–2.6 | `flight-row-{id}` | All 10 fields; ISO in `<time dateTime>`; `data-severity` |
| `IncidentList` | Req 3, 4.1 | `incident-list` | Sorted list or `EmptyState` |
| `IncidentCard` | Req 3.2–3.5 | `incident-card-{id}` | All 8 fields; affected flights/airports or "None"; `data-severity` |
| `AirportStatusList` | Req 5 | `airport-status` | Degraded first; `data-degraded` on degraded rows |
| `SeverityBadge` | Req 4.3 | — | `data-severity="CRITICAL"` etc. — severity not by color alone |
| `EmptyState` | Req 2.7, 3.6, 7.4 | `empty-{section}` | Explicit message |

### State handling (Req 7)

- **Loading:** `app/loading.tsx` renders skeleton/placeholder cards while the server component awaits the snapshot; metric values are absent during load (Req 7.1).
- **Error:** `app/error.tsx` (client component) catches a thrown data error, shows a "couldn't load operational data" message and a **Retry** button that calls `reset()` / `router.refresh()` to re-run the server fetch (Req 7.2, 7.3).
- **Empty:** when the snapshot loads but a section has no items, that section renders `EmptyState` (Req 7.4, Req 2.7, 3.6).

### Accessibility / non-color signaling (Req 4.3, 5.3)

Severity and degraded-airport status are conveyed with text labels and `data-*` attributes in addition to color. Badges include an accessible text label (e.g. "Critical"), so state is not color-only. This also makes states assertable in tests.

---

## Error Handling

| Failure | Where | Behavior |
|---|---|---|
| Data source throws (network/parse) | `getDashboardSnapshot()` | Propagates; caught by `app/error.tsx`; user sees error + Retry (Req 7.2) |
| Flight references missing incident id | `dashboardViewModel` | Ignore the dangling id; treat flight incident fields as "None" — never throw on inconsistent data |
| Incident references missing flight/airport | view model / card | Display the raw id/code; do not crash |
| Missing `estimatedDeparture` | `format.delayMinutes` | Returns `null` → delay "N/A" (Req 2.4) |
| Empty dataset | page | Per-section empty states, not an error (Req 7.4) |

The domain layer is defensive about referential integrity so malformed backend data later cannot crash the UI.

---

## Testing Strategy

Focus on the pure functions and the contract, per Req 8.2 and 8.5. Test runner: **Vitest** (fast, TS-native, no browser needed for the logic tests).

### Unit tests (required — Req 8.5)

- `metrics.test.ts` — Req 1: build a fixture snapshot with known composition; assert every count (active, delayed incl. the >15m rule, cancelled, boarding, with-active-incident, disrupted) and assert zero-count returns `0`.
- `prioritization.test.ts` — Req 4: assert incidents order (severity desc, detectedAt desc, id-asc tiebreaker); assert disrupted-flight order (incident severity → CANCELLED>DIVERTED>DELAYED → delay desc → id asc); assert airports degraded-first; assert stability on equal keys.
- `format.test.ts` — Req 2: `formatDelay` cases (`75 → "1h 15m"`, `80 → "1h 20m"`, `45 → "45m"`, `0 → "0m"`, `null → "N/A"`), `delayMinutes` with null estimated → null.

### Contract test

- `mockData.test.ts` — Req 6.6: assert the mock satisfies coverage (≥20 flights spanning all statuses, ≥5 incidents spanning all severities + all statuses present, ≥4 airports with ≥1 degraded) and referential integrity (all links resolve).

### Component/state tests (optional this iteration, recommended)

- React Testing Library checks that `MetricCard` shows `0`, empty states render when lists are empty, and `data-severity`/`data-degraded` attributes appear — asserting via the `data-testid`s above (Req 8.3).

### Static gates (Req 8.4)

- `tsc --noEmit` (strict) and ESLint pass with no errors as part of the definition of done.
