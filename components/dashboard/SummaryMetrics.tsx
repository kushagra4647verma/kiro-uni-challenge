import type { Airport, DashboardMetrics } from "@/lib/domain/types";
import { AIRPORT_STATUS_LABEL } from "@/lib/domain/labels";
import { AIRPORT_DEGRADED_RANK } from "@/lib/domain/prioritization";
import { MetricCard } from "./MetricCard";

/** Overall airport operational status = the worst status among tracked airports. */
function overallAirportStatus(airports: Airport[]): {
  status: Airport["status"];
  label: string;
} {
  if (airports.length === 0) return { status: "NORMAL", label: "No data" };
  const worst = airports.reduce((acc, a) =>
    (AIRPORT_DEGRADED_RANK[a.status] ?? 0) > (AIRPORT_DEGRADED_RANK[acc.status] ?? 0)
      ? a
      : acc,
  );
  return { status: worst.status, label: AIRPORT_STATUS_LABEL[worst.status] };
}

/**
 * Headline summary panel: the eight metrics that let an operations user gauge
 * the state of operations at a glance (Requirement 1).
 */
export function SummaryMetrics({
  metrics,
  airports,
}: {
  metrics: DashboardMetrics;
  airports: Airport[];
}) {
  const overall = overallAirportStatus(airports);
  const degraded = overall.status === "MAJOR_DELAYS" || overall.status === "CLOSED";

  return (
    <section
      data-testid="summary-metrics"
      aria-label="Operations summary"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <MetricCard metricKey="totalActiveFlights" label="Active flights" value={metrics.totalActiveFlights} />
      <MetricCard metricKey="delayedFlights" label="Delayed flights" value={metrics.delayedFlights} emphasis />
      <MetricCard metricKey="cancelledFlights" label="Cancelled flights" value={metrics.cancelledFlights} emphasis />
      <MetricCard metricKey="boardingFlights" label="Currently boarding" value={metrics.boardingFlights} />
      <MetricCard
        metricKey="flightsWithActiveIncidents"
        label="Flights with active incidents"
        value={metrics.flightsWithActiveIncidents}
        emphasis
      />
      <MetricCard metricKey="recentIncidents" label="Active incidents" value={metrics.recentIncidents} emphasis />
      <MetricCard metricKey="disruptedFlights" label="Disrupted flights" value={metrics.disruptedFlights} emphasis />

      {/* Airport operational status: a status string, not a count. */}
      <div
        data-testid="metric-airportStatus"
        data-status={overall.status}
        data-degraded={degraded ? "true" : undefined}
        className={`rounded-xl border p-4 ${
          degraded ? "border-orange-500/40 bg-orange-500/5" : "border-slate-800 bg-slate-900/60"
        }`}
      >
        <div className="text-xl font-semibold text-slate-50">{overall.label}</div>
        <div className="mt-1 text-sm text-slate-400">Airport operational status</div>
      </div>
    </section>
  );
}
