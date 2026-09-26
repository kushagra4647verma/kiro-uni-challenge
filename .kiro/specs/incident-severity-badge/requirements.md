# Requirements Document

## Introduction

The **Incident Severity Badge** is a small, reusable presentation component that displays an AeroOps incident severity level — `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. It is the single, canonical way severity is shown across the product, so severity looks and behaves consistently wherever it appears (incident cards today, other incident views in future).

A severity badge already exists inside the dashboard feature and is used by the incident card and disrupted-flight row. This spec formalizes that component as a **shared, project-level UI primitive** aligned with the steering guidance: it consumes the existing severity domain type, keeps all severity-related logic outside the component, never signals by color alone, and exposes severity in a programmatically detectable way.

### Context from steering (source of truth)

- **product.md** — critical information is prioritized; data is explicit not ambiguous; state that matters operationally must be conveyed by more than color alone; decorative UI must not compete with operational information.
- **tech.md** — keep business logic out of React components; put reusable logic in pure modules; typed domain models are the single source of truth; strict TypeScript.
- **structure.md** — shared, reusable presentation lives under `components/`; feature-specific UI lives in a feature subfolder; domain types/labels live in `lib/domain/`.

### Scope

- In scope: the badge component, its props contract, its accessibility and detectability guarantees, and relocating the existing badge to a shared location without breaking current consumers.
- Out of scope: changing the `Severity` type or its labels; changing severity ranking/prioritization logic; redesigning incident cards or the dashboard; adding new severity levels.

### Definitions

- **Severity** — the existing domain type in `lib/domain/types.ts`: one of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Programmatically detectable** — the rendered severity value is available to code and assistive technology via a stable attribute (not inferred from styling).

---

## Requirements

### Requirement 1 — Display all four severity levels

**User Story:** As an operations user, I want each incident's severity shown as a clear badge, so that I can gauge how serious it is at a glance.

#### Acceptance Criteria

1. WHEN the badge is given a severity of `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` THEN the system SHALL render a badge for that level.
2. WHEN a severity is rendered THEN the system SHALL display a human-readable text label for that level sourced from the existing severity label map (not a hard-coded string in the component).
3. WHERE the four levels are rendered, the system SHALL give each a visually distinguishable treatment.

---

### Requirement 2 — Use the existing severity domain type

**User Story:** As a developer, I want the badge to use the shared severity type, so that severity stays a single source of truth across the product.

#### Acceptance Criteria

1. The component SHALL type its severity input using the existing `Severity` domain type from `lib/domain/types.ts` and SHALL NOT define its own severity list or enum.
2. IF the severity type gains or changes a level THEN the component's typing SHALL surface the change at compile time (for example via exhaustive mapping) rather than silently ignoring it.
3. The component's human-readable text SHALL come from the existing shared severity label map, so wording is defined once.

---

### Requirement 3 — Never rely on color alone

**User Story:** As an operations user (including those with color vision deficiency), I want severity conveyed by more than color, so that I never misread how serious an incident is.

#### Acceptance Criteria

1. WHEN any severity is rendered THEN the system SHALL convey the level through a visible text label in addition to any color.
2. WHERE color is used to differentiate levels, the system SHALL NOT use color as the only distinguishing signal.
3. The rendered badge SHALL remain unambiguous when viewed without color (for example in grayscale).

---

### Requirement 4 — Severity is programmatically detectable

**User Story:** As a developer writing tests and assistive-tech-facing UI, I want the severity available to code, so that behavior can be asserted and announced without parsing styles.

#### Acceptance Criteria

1. WHEN the badge renders THEN the system SHALL expose the severity value on the rendered element via a stable attribute (for example `data-severity="CRITICAL"`).
2. The exposed attribute value SHALL be the canonical severity token (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), not the display label.
3. The badge SHALL carry an accessible text label so its meaning is available to assistive technology, consistent with Requirement 3.

---

### Requirement 5 — Reusable across incident views

**User Story:** As a developer, I want one badge used everywhere severity appears, so that severity is consistent and there is no duplicate implementation.

#### Acceptance Criteria

1. The component SHALL live in the project's shared component location so it can be imported by incident cards and future incident views without depending on any one feature.
2. The component SHALL render standalone from only a severity value, with no required dependency on incident, flight, or dashboard-specific data.
3. WHEN the badge is relocated to the shared location THEN existing consumers (the incident card and disrupted-flight row) SHALL continue to render severity through this single component with no behavioral change.
4. The system SHALL NOT contain a second, parallel severity-badge implementation after this change.

---

### Requirement 6 — Presentation in the component, logic outside it

**User Story:** As a developer, I want a clean separation, so that severity rules stay testable and the component stays a pure view.

#### Acceptance Criteria

1. The component SHALL contain only presentation concerns (markup, styling, the label/attribute wiring).
2. The component SHALL NOT contain severity business logic such as ranking, comparison, ordering, or thresholds; any such logic SHALL live in the existing pure domain modules.
3. WHERE the component needs the mapping from severity to display label, it SHALL consume that mapping from the shared domain layer rather than defining it inline.
4. The component SHALL be presentational and prop-driven, holding no application state or data fetching.

---

### Requirement 7 — Typing, structure, and testability

**User Story:** As a developer, I want the component to follow project conventions, so that it is consistent and verifiable.

#### Acceptance Criteria

1. The component SHALL be implemented in TypeScript under strict mode with a fully typed props contract.
2. The component SHALL follow the project's existing component and directory conventions from `structure.md`.
3. The component SHALL expose a stable test selector so its label text and `data-severity` value can be asserted for every level.
4. WHEN the project's type check and lint run THEN they SHALL pass with no errors, and existing tests SHALL continue to pass.
