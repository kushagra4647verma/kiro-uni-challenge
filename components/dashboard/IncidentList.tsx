import type { Incident } from "@/lib/domain/types";
import { IncidentCard } from "./IncidentCard";
import { EmptyState } from "./EmptyState";

/**
 * The recent operational incidents section. Consumes the pre-sorted list
 * (highest severity, most recent first, per Requirement 4.1) and renders an
 * explicit empty state when there are none (Requirement 3.6).
 */
export function IncidentList({
  incidents,
  flightNumberById,
}: {
  incidents: Incident[];
  flightNumberById: Map<string, string>;
}) {
  return (
    <section aria-label="Recent operational incidents">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Recent incidents</h2>
        <span className="text-sm text-slate-400">{incidents.length} active</span>
      </div>
      {incidents.length === 0 ? (
        <EmptyState section="incidents" message="No active incidents right now." />
      ) : (
        <ul data-testid="incident-list" className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              flightNumberById={flightNumberById}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
