import type { DisruptedFlightVM } from "@/lib/domain/types";
import { FlightRow } from "./FlightRow";
import { EmptyState } from "./EmptyState";

/**
 * The disrupted-flights section. Consumes the pre-sorted view model (most
 * urgent first, per Requirement 4.2) and renders an explicit empty state when
 * there are no disrupted flights (Requirement 2.7).
 */
export function DisruptedFlightList({
  flights,
}: {
  flights: DisruptedFlightVM[];
}) {
  return (
    <section aria-label="Disrupted flights">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Disrupted flights</h2>
        <span className="text-sm text-slate-400">{flights.length} requiring attention</span>
      </div>
      {flights.length === 0 ? (
        <EmptyState section="disrupted-flights" message="No disrupted flights right now." />
      ) : (
        <ul data-testid="disrupted-flights" className="flex flex-col gap-3">
          {flights.map((vm) => (
            <FlightRow key={vm.flight.id} vm={vm} />
          ))}
        </ul>
      )}
    </section>
  );
}
