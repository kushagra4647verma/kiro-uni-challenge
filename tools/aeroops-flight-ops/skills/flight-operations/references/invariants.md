# AeroOps Domain Invariants

Durable properties of the AeroOps domain logic. These must keep holding when
adding or changing operational logic. They are enforced by the domain tests in
`tests/` — most explicitly by the property-based tests in
`tests/disruption.property.test.ts` (labelled P1–P8) and the example tests in
`tests/metrics.test.ts`, `tests/prioritization.test.ts`, `tests/format.test.ts`,
and `tests/incidentLinks.test.ts`.

## Classification invariants

- **P1 — Active-set exclusivity.** `isActive(flight)` is true exactly when the
  status is not one of `CANCELLED`, `LANDED`, `ARRIVED`.
- **P2 — Delay monotonicity + threshold.** For a non-`DELAYED` flight, pushing
  `estimatedDeparture` later never turns "delayed" off, and the classification
  flips from false to true exactly when the flight is more than 15 minutes late
  (the `DELAY_THRESHOLD_MINUTES` boundary). A `DELAYED` status is always delayed.
- **P3 — Delay-duration consistency.** When computable, `delayMinutes` equals the
  rounded `estimatedDeparture − scheduledDeparture` in minutes; it is `null`
  exactly when `estimatedDeparture` is `null` or a timestamp is unparseable, and
  it never throws.
- **P4 — Disruption superset.** Any flight that is delayed, cancelled, or
  diverted is also disrupted. (Disruption additionally includes flights linked
  to an active incident.)

## Prioritization / ordering invariants

- **P5 — Severity total order.** `SEVERITY_RANK` induces a strict total order:
  `CRITICAL > HIGH > MEDIUM > LOW`.
- **P6 — Ordering is a deterministic total order.** Disrupted-flight and incident
  ordering are transitive and made antisymmetric by the ascending-id tiebreaker,
  and re-sorting an already-sorted list changes nothing (idempotent).
- **P7 — Permutation invariance.** Ordering the same set of items yields the same
  sequence regardless of the input order (the result depends only on the defined
  ranking keys, not on original position).
- **P8 — No mutation.** Every predicate and sort leaves its inputs unchanged;
  sorts return new arrays.

## Referential-integrity tolerance

- Flight↔incident references are id-based and may **dangle**. Resolution logic
  (e.g. `highestSeverityActiveIncident`) ignores missing/inactive references
  rather than throwing, so malformed or partial data cannot crash operational
  views. Preserve this defensiveness in new logic.

## Why these matter

They keep operational reasoning trustworthy: counts and classifications stay
consistent across features, the most urgent items are ordered first
deterministically, and the same data always renders the same way. When you add
domain logic, add or extend tests so these invariants continue to hold.

## Authoritative sources
- `tests/disruption.property.test.ts` (P1–P8)
- `tests/metrics.test.ts`, `tests/prioritization.test.ts`,
  `tests/format.test.ts`, `tests/incidentLinks.test.ts`
- `.kiro/specs/flight-disruption-intelligence` (Requirement 9 — invariants)
