import type { Airport } from "@/lib/domain/types";
import { isDegradedAirport } from "@/lib/domain/prioritization";
import { AirportStatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

/**
 * Airport operational status section (Requirement 5). Airports arrive
 * pre-sorted degraded-first. Degraded rows (MAJOR_DELAYS/CLOSED) carry a
 * data-degraded attribute so they are programmatically detectable, not
 * signalled by color alone (Req 5.3).
 */
export function AirportStatusList({ airports }: { airports: Airport[] }) {
  return (
    <section aria-label="Airport operational status">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Airport status</h2>
        <span className="text-sm text-slate-400">{airports.length} tracked</span>
      </div>
      {airports.length === 0 ? (
        <EmptyState section="airports" message="No airports tracked." />
      ) : (
        <ul data-testid="airport-status" className="flex flex-col gap-2">
          {airports.map((airport) => {
            const degraded = isDegradedAirport(airport.status);
            return (
              <li
                key={airport.code}
                data-testid={`airport-row-${airport.code}`}
                data-degraded={degraded ? "true" : undefined}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  degraded ? "border-orange-500/40 bg-orange-500/5" : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-100">{airport.code}</span>
                  <span className="text-xs text-slate-400">{airport.name}</span>
                </div>
                <AirportStatusBadge status={airport.status} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
