import type { Incident } from "@/lib/domain/types";
import { INCIDENT_TYPE_LABEL } from "@/lib/domain/labels";
import { formatDateTime, toIsoAttr } from "@/lib/domain/format";
import { SeverityBadge } from "@/components/SeverityBadge";
import { IncidentStatusBadge } from "./StatusBadge";

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-slate-500">None</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((it) => (
        <span
          key={it}
          className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-medium text-slate-300"
        >
          {it}
        </span>
      ))}
    </span>
  );
}

/**
 * A single incident, showing all eight required fields: title, type, severity,
 * description, affected flights, affected airports, time detected, current
 * status (Requirement 3.2). Affected flights are shown as flight numbers via
 * the provided lookup; empty sets render "None" (Req 3.3–3.4). Time detected
 * includes a machine-readable ISO value (Req 3.5).
 */
export function IncidentCard({
  incident,
  flightNumberById,
}: {
  incident: Incident;
  flightNumberById: Map<string, string>;
}) {
  const isCritical = incident.severity === "CRITICAL";
  const affectedFlightNumbers = incident.affectedFlightIds.map(
    (id) => flightNumberById.get(id) ?? id,
  );

  return (
    <li
      data-testid={`incident-card-${incident.id}`}
      data-severity={incident.severity}
      className={`rounded-lg border p-4 ${
        isCritical ? "border-red-500/40 bg-red-500/5" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-50">{incident.title}</h3>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
        </div>
      </div>

      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {INCIDENT_TYPE_LABEL[incident.type]}
      </div>

      <p className="mt-2 text-sm text-slate-300">{incident.description}</p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Affected flights</span>
          <Chips items={affectedFlightNumbers} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Affected airports</span>
          <Chips items={incident.affectedAirportCodes} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Detected</span>
          <span className="text-sm text-slate-200">
            <time dateTime={toIsoAttr(incident.detectedAt)}>
              {formatDateTime(incident.detectedAt)}
            </time>
          </span>
        </div>
      </div>
    </li>
  );
}
