/**
 * A single headline metric. Renders its numeric value verbatim, so a zero
 * shows as "0" rather than a blank or placeholder (Requirement 1.7).
 */
export function MetricCard({
  metricKey,
  label,
  value,
  emphasis = false,
}: {
  metricKey: string;
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      data-testid={`metric-${metricKey}`}
      data-value={value}
      className={`rounded-xl border p-4 ${
        emphasis && value > 0
          ? "border-red-500/40 bg-red-500/5"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="text-3xl font-semibold tabular-nums text-slate-50">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}
