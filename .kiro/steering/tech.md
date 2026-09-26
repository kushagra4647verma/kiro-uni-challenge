# Technology & Conventions

## Stack

**Current frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS

**Future backend** (not built yet)
- FastAPI
- Python
- MongoDB

The frontend is being built so that this backend can be introduced later without reworking UI code. Keep that swap in mind for any new feature.

## Language and typing

- TypeScript runs in **strict mode**. Do not weaken it. Avoid `any`; prefer precise types and narrowing.
- **Prefer typed domain models.** Define the shapes of core concepts once, as the single source of truth, and reuse them everywhere. Both the current data source and any future backend adapter conform to the same models.
- Model enumerations as explicit unions/enums rather than loose strings.

## Architecture

- **Keep business logic out of React components.** Components render; they do not compute metrics, sort/prioritize, or transform data inline.
- **Put reusable business logic into pure functions/services.** Counting, prioritization, formatting, and view-model composition live in framework-free modules that can be tested without rendering.
- **Components consume abstractions, not concrete data sources.** UI depends on an interface (e.g. a data-source contract), never on a specific implementation. Selecting the active implementation happens at a single configuration point.
- **Keep the architecture modular** so the frontend can later consume FastAPI by swapping the data-source implementation, with no changes to UI components.
- Prefer a clear data flow: data source → typed domain model → pure logic / view model → presentation.

## API contracts

- **API contracts must be explicit.** The data exchanged between layers (and, in future, between frontend and backend) is a defined, typed contract. The future FastAPI endpoints should return JSON matching the shared domain models so the boundary stays a configuration change, not a rewrite.
- Treat the contract as versionable and documented; do not let implicit or ad-hoc shapes leak across layers.

## Testing

- **Write tests for business logic.** Pure functions and services (metrics, prioritization, formatting, contract/coverage checks) must have unit tests. This is where correctness is proven.
- Component tests are welcome for stateful or interactive UI but are not a substitute for testing the underlying logic.
- The type check, linter, and test suite should pass before a feature is considered done.

## Dependencies

- **Avoid unnecessary dependencies.** Prefer the platform and standard language features. Add a library only when it earns its place; pin sensible versions and prefer well-maintained packages.
- **Do not introduce AWS (or other cloud) services unless they provide a concrete benefit** for the task at hand. Default to the simplest thing that works locally.
