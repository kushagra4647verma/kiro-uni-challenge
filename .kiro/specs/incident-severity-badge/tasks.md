# Implementation Plan

This plan formalizes the existing severity badge into a shared, reusable primitive without changing its behavior. Work in small, verifiable steps and keep existing consumers green throughout. Do not modify the `Severity` type, `SEVERITY_LABEL`, or `SEVERITY_RANK`.

- [x] 1. Relocate the badge to the shared component location
  - Move `components/dashboard/SeverityBadge.tsx` to `components/SeverityBadge.tsx` using an import-preserving move so references update automatically.
  - Verify the imports in `components/dashboard/IncidentCard.tsx` and `components/dashboard/FlightRow.tsx` now resolve to `@/components/SeverityBadge`.
  - Confirm no second severity-badge implementation remains anywhere.
  - _Requirements: 5.1, 5.3, 5.4, 7.2_

- [x] 2. Formalize the component contract
  - Define and export a typed `SeverityBadgeProps` interface: required `severity: Severity` (imported from `lib/domain/types.ts`) and optional `className?: string`.
  - Keep the input typed only via the shared `Severity` type; do not declare a local severity list/enum.
  - _Requirements: 2.1, 6.4, 7.1_

- [x] 3. Confirm label and style mapping consume shared sources and stay exhaustive
  - Ensure the display text comes from `SEVERITY_LABEL` (no inline strings) and the style map is typed `Record<Severity, string>` so a new level fails type-check until handled.
  - Ensure no severity ranking/comparison/threshold logic exists in the component (that logic stays in `lib/domain/prioritization.ts`).
  - _Requirements: 1.2, 2.2, 2.3, 6.1, 6.2, 6.3_

- [x] 4. Wire detectability and accessibility, plus the optional className
  - Render the visible label text (non-color-only signaling) and set `data-severity` to the canonical token (`LOW`|`MEDIUM`|`HIGH`|`CRITICAL`), distinct from the label.
  - Add a stable `data-testid` selector and append the optional `className` for consumer layout without the badge owning positioning.
  - _Requirements: 1.1, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 7.3_

- [x] 5. Add component test tooling
  - Add a DOM test environment (jsdom) and React Testing Library, and configure the test runner to use the DOM environment for `*.test.tsx` while leaving the existing node-environment logic tests unchanged.
  - Keep the dependency footprint minimal, per tech.md.
  - _Requirements: 7.3, 7.4_

- [x] 6. Write the badge component test
  - In `tests/severityBadge.test.tsx`, for each of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`: assert the visible text equals the expected `SEVERITY_LABEL` value and `data-severity` equals the canonical token.
  - Assert the badge renders from a severity value alone (standalone/reusable), with no incident/flight/dashboard data required.
  - _Requirements: 1.1, 3.1, 4.1, 4.2, 5.2, 7.3_

- [x] 7. Verify no regression and pass static gates
  - Run the full test suite (existing logic tests + the new component test) and ensure all pass.
  - Run `tsc --noEmit` (strict) and lint with no errors.
  - Manually confirm incident cards and disrupted-flight rows still render severity identically (same label, same `data-severity`).
  - _Requirements: 5.3, 7.4_
