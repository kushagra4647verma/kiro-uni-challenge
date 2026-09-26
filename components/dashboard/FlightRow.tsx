import type { DisruptedFlightVM } from "@/lib/domain/types";
import { INCIDENT_TYPE_LABEL } from "@/lib/domain/labels";
import { formatDateTime, toIsoAttr } from "@/lib/domain/format";
import { FlightStatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";

/** One labelled field within a flight row. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-200">{children}</span>
    </div>
  );
}

/**
 * A single disrupted flight, showing all ten required fields: flight number,
 * airline, origin, destination, scheduled departure, estimated departure,
 * current status, delay duration, incident type, incident severity
 * (Requirement 2.2). Missing incident fields render "None"; inapplicable delay
 * renders "N/A". Timestamps include a machine-readable ISO value (Req 2.3–2.6).
 */
export function FlightRow({ vm }: { vm: DisruptedFlightVM }) {
  const { flight } = vm;
  const isCritical = vm.topIncidentSeverity === "CRITICAL";

  return (
    <li
      data-testid={`flight-row-${flight.id}`}
      data-severity={vm.topIncidentSeverity ?? undefined}
      className={`rounded-lg border p-4 ${
        isCritical ? "border-red-500/40 bg-red-500/5" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-50">{flight.flightNumber}</span>
          <span className="text-sm text-slate-400">{flight.airline}</span>
        </div>
        <FlightStatusBadge status={flight.status} />
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
        <span className="font-medium">{flight.origin}</span>
        <span aria-hidden className="text-slate-500">→</span>
        <span className="font-medium">{flight.destination}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Scheduled">
          <time dateTime={toIsoAttr(flight.scheduledDeparture)}>
            {formatDateTime(flight.scheduledDeparture)}
          </time>
        </Field>
        <Field label="Estimated">
          {flight.estimatedDeparture ? (
            <time dateTime={toIsoAttr(flight.estimatedDeparture)}>
              {formatDateTime(flight.estimatedDeparture)}
            </time>
          ) : (
            <span className="text-slate-500">N/A</span>
          )}
        </Field>
        <Field label="Delay">
          <span data-testid={`flight-delay-${flight.id}`}>{vm.delayLabel}</span>
        </Field>
        <Field label="Incident type">
          {vm.topIncidentType ? INCIDENT_TYPE_LABEL[vm.topIncidentType] : (
            <span className="text-slate-500">None</span>
          )}
        </Field>
        <Field label="Incident severity">
          {vm.topIncidentSeverity ? (
            <SeverityBadge severity={vm.topIncidentSeverity} />
          ) : (
            <span className="text-slate-500">None</span>
          )}
        </Field>
      </div>
    </li>
  );
}
