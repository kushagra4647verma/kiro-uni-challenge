import type { Severity } from "@/lib/domain/types";
import { SEVERITY_LABEL } from "@/lib/domain/labels";

const SEVERITY_CLASSES: Record<Severity, string> = {
  LOW: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-300 ring-red-500/40",
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({
  severity,
  className = "",
}: SeverityBadgeProps) {
  return (
    <span
      data-testid="severity-badge"
      data-severity={severity}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${SEVERITY_CLASSES[severity]} ${className}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}