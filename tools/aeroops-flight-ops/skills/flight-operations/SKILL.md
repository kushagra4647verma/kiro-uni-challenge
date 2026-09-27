---
name: flight-operations
description: >-
  AeroOps domain expertise for flight operations and incident intelligence. Use
  when building, modifying, or reasoning about AeroOps features that touch
  flights, disruptions, delays, incidents, severity, airport status, or
  operational prioritization. Grounds decisions in the rules already
  established by the AeroOps project rather than general aviation knowledge.
---

# AeroOps Flight Operations & Incident Intelligence

This skill captures the durable domain knowledge of the AeroOps platform —
an AI-powered Flight Operations and Incident Intelligence platform for airline,
airport, and dispatch/operational-control teams. It exists so Kiro applies the
project's *own* established rules consistently across features, instead of
inventing aviation rules or re-deriving definitions each time.

## When to use this skill

Consult this skill when a task involves any of:

- Flight operational **state** (which statuses exist, which count as "active").
- **Delay** or **disruption** classification, or delay-duration reasoning.
- **Incidents**: lifecycle/status, severity, or how incidents affect flights.
- **Airport** operational status or "degraded" airports.
- **Prioritization / ordering** of flights or incidents for operational attention.
- Domain **terminology** used in AeroOps UI and code.
- Verifying **domain invariants** when adding or changing logic.

If a feature does not touch the operational domain (e.g. pure styling or build
config), this skill is not needed.

## How to use it

1. **Treat the AeroOps project as the source of truth for AeroOps behavior.**
   AeroOps defines a deliberately small rule set. Do not introduce FAA rules,
   NOTAMs, maintenance classifications, or other external aviation regulations
   unless a future AeroOps specification explicitly adopts them.
2. **Read the relevant reference, then the cited source.** The `references/`
   files summarize the rules and point to the authoritative code/spec. For
   anything you will change, open the cited source file to confirm current
   behavior before editing.
3. **Reuse the canonical domain surface.** Classification, prioritization, and
   delay logic already live as pure functions in `lib/domain/`. Import and
   reuse them (via `lib/domain/disruption.ts`) rather than reimplementing rules.
4. **Honor AeroOps conventions** (single source of truth, business logic kept
   pure and framework-independent, UI consuming abstractions, non-color-only
   signaling). These are documented in the accompanying steering
   (`dev.kiro/steering/conventions.md`).

## Reference map

Detailed knowledge lives in `references/` to keep this file small:

- **`references/domain-model.md`** — entities and enums: flight states, incident,
  airport, severity, and the terminology AeroOps uses.
- **`references/operational-rules.md`** — active / delayed / disrupted
  definitions, the delay threshold, and the incident lifecycle.
- **`references/prioritization.md`** — severity ranking, disrupted-flight and
  incident ordering, and the deterministic tiebreaker.
- **`references/invariants.md`** — durable domain invariants that must keep
  holding (the properties the domain tests enforce).

## Authoritative sources (reference these; do not duplicate their code)

- Types & enums: `lib/domain/types.ts`
- Classification & constants: `lib/domain/metrics.ts`
- Prioritization & ranking: `lib/domain/prioritization.ts`
- Delay duration: `lib/domain/format.ts`; incident linking: `lib/domain/incidentLinks.ts`
- Canonical reuse surface: `lib/domain/disruption.ts`
- Terminology labels: `lib/domain/labels.ts`
- Specs: `.kiro/specs/flight-operations-dashboard`,
  `.kiro/specs/flight-disruption-intelligence`,
  `.kiro/specs/incident-severity-badge`
- Project guidance: `.kiro/steering/{product,tech,structure}.md`
