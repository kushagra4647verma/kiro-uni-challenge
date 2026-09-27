# AeroOps Conventions

Project-specific conventions Kiro should follow when building AeroOps flight
operations features. These are drawn from the AeroOps steering
(`.kiro/steering/{product,tech,structure}.md`) and the established domain code;
they are summarized here so the flight-operations skill carries them alongside
the domain knowledge. The repository steering files remain authoritative.

## Domain and logic

- **Single source of truth for domain shapes.** Types and enums live once in
  `lib/domain/types.ts`; display wording in `lib/domain/labels.ts`. Do not
  redefine severities, statuses, or entity shapes elsewhere.
- **One canonical rule surface.** Classification, delay, and prioritization
  logic is reused via `lib/domain/disruption.ts`. Do not reimplement the
  active/delayed/disrupted rules, the 15-minute threshold, or the severity
  ranking — import them.
- **Business logic stays pure and framework-independent.** Rules live in
  `lib/domain/` (and composition in `lib/viewmodel/`) and must not import React
  or Next.js. Components render; they do not compute or sort inline.
- **Deterministic ordering.** Any new ordering must be total and stable, ending
  in an id/code tiebreaker, and must not mutate its input.

## Data access

- **Components consume abstractions, not concrete sources.** UI depends on the
  `DashboardDataSource` interface (`lib/data/`), never a specific
  implementation. The active source is selected at a single configuration point
  so the mock can later be swapped for a FastAPI + MongoDB backend with no UI
  changes.
- **The snapshot shape is the contract.** A data source returns a
  `DashboardSnapshot`; the future backend should return JSON matching it.

## Presentation

- **Never signal by color alone.** Operationally meaningful state (severity,
  degraded airport, disruption) must be conveyed with text labels and explicit
  indicators, and be programmatically detectable (e.g. `data-severity`,
  `data-degraded`).
- **Explicit over ambiguous.** Missing or not-applicable values are shown
  plainly ("None", "N/A"), never left blank. Loading, empty, and error states
  must be clearly distinguished from real operational data.
- **No decorative UI that competes with operational information.**

## Testing and dependencies

- **Test the business logic.** Pure functions and invariants get unit tests
  (example-based and, where a general property applies, property-based). Keep
  the domain invariants in `references/invariants.md` passing.
- **Reuse existing project commands** for verification: `npm run type-check`,
  `npm run lint`, `npm run test`.
- **Avoid unnecessary dependencies**, and do not add AWS/cloud services without
  a concrete benefit. No MCP is required for this domain knowledge.

## Scope discipline

- **Do not invent aviation rules.** Only rules established by AeroOps specs,
  domain code, tests, or steering apply. External regulations (FAA, NOTAMs,
  maintenance classifications, regulatory delay codes) are out of scope unless a
  future AeroOps specification explicitly adopts them.
- **Prefer a small working feature over speculative functionality**, consistent
  with the AeroOps MVP principle.

## Authoritative sources
- `.kiro/steering/product.md`, `.kiro/steering/tech.md`, `.kiro/steering/structure.md`
- `lib/domain/`, `lib/data/`, `lib/viewmodel/`, `tests/`
