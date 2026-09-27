# Requirements Document

## Introduction

**Flight Disruption Intelligence** is the reusable, pure, framework-independent core of AeroOps' flight operational rules. It consolidates the flight-classification and prioritization logic that the Flight Operations Dashboard already relies on into a cohesive, explicitly-documented domain module surface, so any current or future feature (dashboard, alerts, future FastAPI backend) applies the *same* rules from a single source of truth.

This feature is primarily a **consolidation and formalization**, not a green-field build. The rules already exist as pure functions in `lib/domain/` (`metrics.ts`, `prioritization.ts`, `format.ts`), and one piece — resolving a flight's highest-severity linked active incident — currently lives as a private helper inside `lib/viewmodel/dashboardViewModel.ts`. This spec defines a stable, reusable "disruption intelligence" surface, extracts the one non-shared helper into the domain layer, and pins the rules down with tests, **without duplicating existing domain types or logic**.

### Source of truth

The AeroOps definitions in the Flight Operations Dashboard requirements are authoritative. This spec restates them as behaviors to be exposed reusably; it does not invent new rules. Where a rule is already implemented, this feature reuses that implementation rather than reimplementing it.

### Reuse constraints (from steering)

- **tech.md** — business logic lives in pure, framework-free modules; typed domain models are the single source of truth; do not weaken strict typing; write tests for business logic.
- **structure.md** — reusable framework-free logic belongs in `lib/domain/`; modules there must not import React; tests live in `tests/`.
- **No duplication** — the `Severity`, `Flight`, `Incident`, `FlightStatus` types and the existing predicates/sorts are reused as-is. No parallel copies of types or rules are created.

### Scope

- In scope: a documented, reusable domain surface for the seven behaviors below; extraction of the highest-severity-linked-incident helper into the domain layer; identification of property-based-testable invariants; tests (example-based + property-based) for the invariants.
- Out of scope: changing any rule's meaning; changing domain types; UI changes; the dashboard view model's composition role (it will consume this surface); new dependencies beyond a property-testing dev tool if adopted during implementation.

### Definitions (authoritative, reused)

- **Active statuses**: `SCHEDULED`, `BOARDING`, `DEPARTED`, `EN_ROUTE`, `DELAYED`, `DIVERTED`. `CANCELLED`, `LANDED`, `ARRIVED` are **not** active.
- **Delay threshold**: 15 minutes past scheduled departure.
- **Active incident**: status `OPEN` or `MONITORING` (not `RESOLVED`).
- **Severity order**: `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`.

---

## Requirements

### Requirement 1 — Active-flight classification

**User Story:** As a developer building operational features, I want one authoritative active-flight rule, so that every feature agrees on which flights are active.

#### Acceptance Criteria

1. The feature SHALL expose a pure predicate that returns true exactly when a flight's status is one of `SCHEDULED`, `BOARDING`, `DEPARTED`, `EN_ROUTE`, `DELAYED`, `DIVERTED`.
2. The predicate SHALL return false for `CANCELLED`, `LANDED`, and `ARRIVED`.
3. The predicate SHALL depend only on the flight's status and SHALL NOT mutate its input.
4. The feature SHALL reuse the existing active-status definition rather than declaring a second copy.

---

### Requirement 2 — Delayed-flight classification

**User Story:** As a developer, I want one authoritative delayed-flight rule, so that "delayed" means the same thing everywhere.

#### Acceptance Criteria

1. The feature SHALL expose a pure predicate that returns true when a flight's status is `DELAYED`.
2. WHEN a flight's status is not `DELAYED` THEN the predicate SHALL return true only if its estimated departure is more than 15 minutes after its scheduled departure.
3. WHERE estimated departure is null or a timestamp is unparseable, the delay SHALL be treated as not computable and the flight SHALL NOT be classified as delayed by the threshold rule (status `DELAYED` still classifies as delayed).
4. The threshold (15 minutes) SHALL come from the existing shared constant, not a duplicated literal.

---

### Requirement 3 — Delay-duration calculation

**User Story:** As a developer, I want a single delay-duration calculation, so that delay magnitude is computed consistently.

#### Acceptance Criteria

1. The feature SHALL expose a pure function computing the whole-minute difference between scheduled and estimated departure.
2. WHEN estimated departure is null THEN the function SHALL return a not-computable result (null).
3. WHEN either timestamp is unparseable THEN the function SHALL return a not-computable result (null) rather than throwing.
4. The function SHALL reuse the existing delay-duration implementation; no second calculation SHALL be introduced.

---

### Requirement 4 — Disrupted-flight classification

**User Story:** As a developer, I want one authoritative disrupted-flight rule, so that disruption is identified consistently.

#### Acceptance Criteria

1. The feature SHALL expose a pure predicate that returns true when a flight's status is `DELAYED`, `CANCELLED`, or `DIVERTED`.
2. The predicate SHALL also return true when the flight is linked to at least one active incident.
3. The predicate SHALL determine "active incident" using the set of currently-active incident ids, provided as an input, and SHALL treat a link to a resolved (or missing) incident as not contributing to disruption.
4. The predicate SHALL NOT mutate its inputs and SHALL reuse the existing disruption and active-incident definitions.

---

### Requirement 5 — Incident severity prioritization

**User Story:** As a developer, I want a single severity ranking, so that severity ordering is identical across incidents and flights.

#### Acceptance Criteria

1. The feature SHALL expose the severity ranking such that `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`.
2. The ranking SHALL be the existing single source of truth (`SEVERITY_RANK`), reused by every consumer; no alternate ranking SHALL be defined.
3. The feature SHALL expose a pure function that, given a flight and the resolvable active incidents, returns the flight's highest-severity linked active incident (or none). This consolidates the helper currently private to the dashboard view model.
4. The highest-severity resolution SHALL ignore resolved incidents and dangling incident references without throwing.

---

### Requirement 6 — Disrupted-flight prioritization

**User Story:** As an operations user, I want disrupted flights ordered by urgency, so that the most critical flights appear first.

#### Acceptance Criteria

1. The feature SHALL order disrupted flights by, in order of precedence: (a) highest linked active-incident severity descending, (b) disruption type with `CANCELLED` before `DIVERTED` before `DELAYED`, (c) longest delay duration first.
2. A flight with no linked active incident SHALL rank below any flight with a linked active incident on the severity key.
3. Ordering SHALL reuse the existing severity ranking and disruption ranking; no duplicate ranking tables SHALL be introduced.
4. The ordering function SHALL return a new ordered collection and SHALL NOT mutate its input.

---

### Requirement 7 — Deterministic ordering

**User Story:** As a developer, I want ordering to be fully deterministic, so that identical data always produces identical output.

#### Acceptance Criteria

1. WHEN two items are equal on all defined ranking keys THEN the feature SHALL break the tie by ascending flight id (and, for incidents, ascending incident id).
2. WHEN the same input is ordered repeatedly THEN the output order SHALL be identical every time.
3. Ordering SHALL be a total order over any input (no pair is left with an undefined relative position).
4. Reordering an already-ordered input SHALL leave it unchanged (the ordering is idempotent).

---

### Requirement 8 — Framework independence and structure

**User Story:** As a developer, I want this logic usable by any layer, so that the backend and non-UI features can reuse it unchanged.

#### Acceptance Criteria

1. Every function in this feature SHALL be pure and framework-independent and SHALL NOT import React, Next.js, or any rendering/browser API.
2. The feature SHALL live in `lib/domain/` per structure.md and SHALL reuse the existing shared domain types from `lib/domain/types.ts`.
3. WHEN the dashboard view model is later updated to consume this surface THEN it SHALL do so without changing any rule's behavior (the extraction is behavior-preserving).
4. The feature SHALL add no dependency on a data source, backend, or environment; inputs are plain domain values.

---

### Requirement 9 — Testability, including property-based invariants

**User Story:** As a developer, I want the rules proven by tests, so that consolidation does not silently change behavior.

#### Acceptance Criteria

1. The feature SHALL have example-based unit tests covering each classification and the ordering precedence, consistent with the existing test style.
2. The feature SHALL identify the behaviors expressible as **general properties** and cover them with property-based tests over randomized valid inputs.
3. The following behaviors SHALL be treated as property-based-testable invariants:
   - **P1 (mutual exclusivity of active set):** for any flight, `isActive` is true iff its status is not `CANCELLED`/`LANDED`/`ARRIVED`.
   - **P2 (delay monotonicity):** for a non-`DELAYED` flight, increasing estimated departure never changes its delayed classification from true to false; crossing the 15-minute threshold flips it from false to true.
   - **P3 (delay-duration sign/consistency):** when computable, delay minutes equals the rounded scheduled→estimated difference, and is null exactly when estimated is null or a timestamp is invalid.
   - **P4 (disruption superset):** any flight classified delayed, cancelled, or diverted is also classified disrupted.
   - **P5 (severity total order):** `SEVERITY_RANK` induces a strict total order with `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`.
   - **P6 (ordering is a total preorder + deterministic tiebreak):** disrupted-flight and incident ordering are transitive, antisymmetric under the id tiebreaker, and stable/idempotent under repeated application.
   - **P7 (permutation invariance):** ordering the same multiset of items produces the same sequence regardless of input order (no dependence on original position beyond the defined keys).
   - **P8 (no mutation):** every predicate and ordering function leaves its inputs unchanged.
4. Property-based tests MAY use a property-testing dev dependency; if adopted it SHALL be a dev-only dependency consistent with tech.md's "avoid unnecessary dependencies," and SHALL NOT affect application behavior.
5. WHEN the type check, lint, and tests run THEN they SHALL pass, and the pre-existing dashboard tests SHALL continue to pass unchanged.
