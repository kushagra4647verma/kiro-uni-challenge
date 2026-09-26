import type { Severity } from "@/lib/domain/types";
import { SEVERITY_LABEL } from "@/lib/domain/labels";

const SEVERITY_CLASSES: Record<Severity, string> = {
  LOW: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-300 ring-red-500/40",
};

/**
 * Severity indicator. Conveys level with a text label AND a data-severity
 * attribute (not color alone), so criticality is programmatically detectable
 * and accessible (Requirements 4.3, 8.3).
 */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      data-severity={severity}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${SEVERITY_CLASSES[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
