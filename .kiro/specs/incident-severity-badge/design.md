# Design Document

## Overview

The Incident Severity Badge is a small, presentational React component that renders one AeroOps `Severity` level as a labelled badge. It is the single canonical way severity is displayed across AeroOps.

A working version already exists at `components/dashboard/SeverityBadge.tsx` and is consumed by `IncidentCard` and `FlightRow`. It already: types its input with the shared `Severity`, pulls its text from `SEVERITY_LABEL`, renders a text label (not color-only), and sets `data-severity`. The design therefore **formalizes and relocates** this component into the shared component layer rather than building a new one — satisfying the "reusable, no duplicate implementation" requirements while leaving behavior unchanged.

### Goals mapped to requirements

- One shared, prop-driven badge for all four levels → Req 1, Req 5.
- Consumes the existing `Severity` type and `SEVERITY_LABEL` map → Req 2, Req 6.3.
- Text label + non-color-only signaling → Req 3.
- Stable `data-severity` token + accessible label → Req 4.
- Presentation only; no severity logic inside → Req 6.
- Strict typing, project conventions, test selector → Req 7.

### Non-goals

Changing the `Severity` type, its labels, or ranking (`SEVERITY_RANK` in `lib/domain/prioritization.ts`); redesigning incident cards; introducing new levels or theming systems.

---

## Placement and structure

Per `structure.md`, shared reusable presentation belongs at the `components/` root, while feature-specific UI stays in a feature subfolder. This badge is reusable across incident views and is already used by more than one consumer, so it becomes a shared primitive.

**Move:** `components/dashboard/SeverityBadge.tsx` → `components/SeverityBadge.tsx`

Update the two existing imports (`IncidentCard.tsx`, `FlightRow.tsx`) to the new path. No other change to those files. This uses an import-preserving move so references update consistently and no second implementation is introduced (Req 5.3, 5.4).

```
components/
  SeverityBadge.tsx        # shared primitive (moved here)
  dashboard/
    IncidentCard.tsx       # imports @/components/SeverityBadge
    FlightRow.tsx          # imports @/components/SeverityBadge
    ...
lib/
  domain/
    types.ts               # Severity (unchanged) — single source of truth
    labels.ts              # SEVERITY_LABEL (unchanged) — display wording
    prioritization.ts      # SEVERITY_RANK (unchanged) — severity logic stays here
tests/
  severityBadge.test.tsx   # new: renders every level, asserts label + data-severity
```

If a broader shared-UI convention emerges later (e.g. `components/ui/`), the badge can move again; for the current project size a flat `components/` root is appropriate and avoids a premature folder.

---

## Component contract

```ts
import type { Severity } from "@/lib/domain/types";

export interface SeverityBadgeProps {
  severity: Severity;                 // Req 2.1 — shared domain type only
  className?: string;                 // optional layout hook for consumers
}

export function SeverityBadge(props: SeverityBadgeProps): JSX.Element;
```

- **Prop-driven and standalone (Req 5.2, 6.4):** the only required input is a `Severity`. No incident/flight/dashboard data, no state, no fetching.
- **`className` passthrough:** lets consumers handle spacing/positioning without the badge owning layout concerns. Purely additive; does not change the badge's own styling responsibilities.

### Rendering

```tsx
<span
  data-testid="severity-badge"
  data-severity={severity}                 // Req 4.1, 4.2 — canonical token
  className={`${base} ${SEVERITY_CLASSES[severity]} ${className ?? ""}`}
>
  {SEVERITY_LABEL[severity]}                {/* Req 1.2, 3.1 — text label */}
</span>
```

- The visible text label satisfies non-color-only signaling and doubles as the accessible name (Req 3.1, 4.3). Because the label is real text content, the meaning is announced by assistive tech without extra ARIA.
- `data-severity` carries the raw token (`CRITICAL`), distinct from the display label (`Critical`) (Req 4.2).
- `data-testid="severity-badge"` gives a stable selector for tests (Req 7.3).

### Severity → style mapping

A `Record<Severity, string>` of Tailwind classes maps each level to a distinct treatment. Typing it as `Record<Severity, ...>` makes the mapping **exhaustive**: if `Severity` gains a level, the map fails to type-check until updated (Req 2.2). This mirrors the existing implementation.

| Severity | Distinct visual weight |
|---|---|
| LOW | calm/low-emphasis |
| MEDIUM | moderate |
| HIGH | elevated |
| CRITICAL | strongest emphasis |

Color is one signal; the **text label is always present**, so the badge is unambiguous in grayscale (Req 3.2, 3.3). Severity ordering/weight decisions (which level is "more severe") are not encoded as logic in the component — they live in `SEVERITY_RANK`. The badge only maps a level to a style, which is presentation.

---

## Separation of concerns (Req 6)

| Concern | Location | Why |
|---|---|---|
| Severity type | `lib/domain/types.ts` | Single source of truth |
| Display wording | `lib/domain/labels.ts` (`SEVERITY_LABEL`) | Defined once, reused |
| Severity ranking/ordering | `lib/domain/prioritization.ts` (`SEVERITY_RANK`) | Business logic, unit-tested, framework-free |
| Markup, styling, label/attr wiring | `SeverityBadge.tsx` | Presentation only |

The component imports the type and label map; it defines no severity list, no comparison, no thresholds. This keeps the badge a pure view and keeps severity logic testable without rendering, per `tech.md`.

---

## Accessibility

- Severity is conveyed by **visible text** plus color, never color alone (Req 3).
- The text label is the element's accessible name; no color-dependent meaning.
- Sufficient contrast between text and background is required for each level so the label is legible independent of hue.
- `data-severity` aids automated testing and any programmatic consumers; it complements, not replaces, the human-readable label.

---

## Impact on existing code

- **Behavioral change:** none. Output markup for existing consumers is identical (same label text, same `data-severity`, same classes). The optional `className` prop and `data-testid` are additive.
- **Import updates:** `IncidentCard.tsx` and `FlightRow.tsx` change their import path only.
- **Dashboard spec:** unaffected; its acceptance criteria around `data-severity="CRITICAL"` still hold because the attribute and value are preserved.

---

## Testing Strategy

A component test (React Testing Library) is appropriate here because the unit under test is presentational; the severity *logic* is already covered by `prioritization.test.ts`.

`tests/severityBadge.test.tsx` (Req 1, 3, 4, 7.3):
- For each of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`: render the badge and assert (a) the visible text equals the expected `SEVERITY_LABEL` value, and (b) the element's `data-severity` equals the canonical token.
- Assert the badge renders from a severity value alone (no other props required) — the reusability/standalone guarantee (Req 5.2).

Test tooling note: component tests need a DOM environment (e.g. jsdom) and React Testing Library. Adding these is a small, contained tooling change during implementation; the existing node-environment logic tests are unaffected.

### Static gates (Req 7.4)
- Type check (`tsc --noEmit`, strict) and lint pass with no errors.
- Existing unit tests continue to pass (the move must not regress the dashboard).
