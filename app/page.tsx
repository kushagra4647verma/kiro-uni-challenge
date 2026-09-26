import { getDataSource } from "@/lib/data/getDataSource";
import { buildDashboardViewModel } from "@/lib/viewmodel/dashboardViewModel";
import { formatDateTime } from "@/lib/domain/format";
import { SummaryMetrics } from "@/components/dashboard/SummaryMetrics";
import { DisruptedFlightList } from "@/components/dashboard/DisruptedFlightList";
import { IncidentList } from "@/components/dashboard/IncidentList";
import { AirportStatusList } from "@/components/dashboard/AirportStatusList";

// Always render fresh so mock timestamps (and later, live backend data) are
// current on each load rather than statically cached at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getDataSource().getDashboardSnapshot();
  const vm = buildDashboardViewModel(snapshot);

  // Lookup so incidents can display flight numbers instead of internal ids.
  const flightNumberById = new Map(
    snapshot.flights.map((f) => [f.id, f.flightNumber]),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            AeroOps — Flight Operations
          </h1>
          <p className="text-sm text-slate-400">
            Live operational picture across the network.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Updated{" "}
          <time dateTime={vm.generatedAt}>{formatDateTime(vm.generatedAt)}</time>
        </p>
      </header>

      <SummaryMetrics metrics={vm.metrics} airports={vm.airports} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Attention-critical columns first on wide screens */}
        <div className="lg:col-span-2">
          <DisruptedFlightList flights={vm.disruptedFlights} />
        </div>
        <div className="flex flex-col gap-8">
          <AirportStatusList airports={vm.airports} />
        </div>
      </div>

      <div className="mt-8">
        <IncidentList incidents={vm.incidents} flightNumberById={flightNumberById} />
      </div>
    </main>
  );
}
