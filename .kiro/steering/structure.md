# Project Structure

The repository currently holds the Next.js frontend at the root. The layout keeps concerns separated so a backend can be added later without mixing frontend and backend code.

## Current layout

```
app/                     # Next.js App Router: routes, pages, layouts, loading/error UI
components/
  dashboard/             # Feature (dashboard) presentation components
lib/
  domain/                # Typed domain models + pure business logic
  data/                  # Data-source abstraction + implementations
  viewmodel/             # Composition of domain data into UI-ready view models
tests/                   # Unit tests for business logic
.kiro/
  specs/                 # Spec-driven feature docs (requirements, design, tasks)
  steering/              # Durable project-level guidance (these files)
```

## Conventions

### UI components (`components/`)
Shared, reusable presentation lives under `components/`. Components are typed, render from props, and hold no business logic. Group components by feature in a subfolder as features grow.

### Dashboard components (`components/dashboard/`)
Components specific to a feature live in a feature-named subfolder (the dashboard is the first). Keep feature-specific UI out of the shared root so features stay self-contained. New features get their own sibling subfolder.

### Domain models (`lib/domain/`)
The typed shapes of core concepts and their enumerations are defined once here as the single source of truth. Everything else — data sources, logic, view models, presentation — imports these types rather than redefining shapes.

### Data sources (`lib/data/`)
The data-access abstraction (interface) and its implementations live here, with each concrete implementation in its own subfolder (e.g. a mock source now, an HTTP/FastAPI adapter later). A single factory/configuration module selects the active implementation. UI never imports a concrete data source directly.

### Business logic (`lib/domain/` and `lib/viewmodel/`)
Reusable, framework-free logic — counting, prioritization, formatting — lives in `lib/domain/`. Composition of that logic into UI-ready structures lives in `lib/viewmodel/`. These modules must not import React.

### Tests (`tests/`)
Unit tests for business logic live under `tests/`, mirroring the module they cover. Prioritize testing pure functions and the data contract. Co-locating component tests near their components is acceptable when added.

### Kiro specs (`.kiro/specs/`)
Each feature gets a folder containing its requirements, design, and tasks. Specs are the source of truth for feature-level detail. Steering files (project-wide guidance) must not duplicate individual spec acceptance criteria.

### Documentation
Keep durable, cross-feature guidance in `.kiro/steering/`. Feature-specific documentation belongs in that feature's spec folder. A root `README` may cover setup and how to run the project. Do not scatter overlapping docs.

## When the backend is introduced

Introduce the backend as a **separate top-level concern** (e.g. a dedicated `backend/` or `server/` directory, or a separate package) so Python/FastAPI/MongoDB code never mixes with the frontend. The frontend consumes it through the existing data-source abstraction: add an HTTP implementation and select it at the configuration point. No UI components should change.

## Sizing

Keep the structure proportional to the current project. Add directories only when there is code to put in them — do not create empty folders to match this document ahead of need. This layout is a target to grow into, not a scaffold to pre-build.
