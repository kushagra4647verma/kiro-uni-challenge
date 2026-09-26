import type {
  AirportOpStatus,
  FlightStatus,
  IncidentStatus,
} from "@/lib/domain/types";
import {
  AIRPORT_STATUS_LABEL,
  FLIGHT_STATUS_LABEL,
  INCIDENT_STATUS_LABEL,
} from "@/lib/domain/labels";

const FLIGHT_STATUS_CLASSES: Record<FlightStatus, string> = {
  SCHEDULED: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  BOARDING: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  DEPARTED: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  EN_ROUTE: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  DELAYED: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  DIVERTED: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CANCELLED: "bg-red-500/20 text-red-300 ring-red-500/40",
  LANDED: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
  ARRIVED: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

const INCIDENT_STATUS_CLASSES: Record<IncidentStatus, string> = {
  OPEN: "bg-red-500/15 text-red-300 ring-red-500/30",
  MONITORING: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

const AIRPORT_STATUS_CLASSES: Record<AirportOpStatus, string> = {
  NORMAL: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  MINOR_DELAYS: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  MAJOR_DELAYS: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  CLOSED: "bg-red-500/20 text-red-300 ring-red-500/40",
};

const badgeBase =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset";

export function FlightStatusBadge({ status }: { status: FlightStatus }) {
  return (
    <span data-status={status} className={`${badgeBase} ${FLIGHT_STATUS_CLASSES[status]}`}>
      {FLIGHT_STATUS_LABEL[status]}
    </span>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span data-status={status} className={`${badgeBase} ${INCIDENT_STATUS_CLASSES[status]}`}>
      {INCIDENT_STATUS_LABEL[status]}
    </span>
  );
}

export function AirportStatusBadge({ status }: { status: AirportOpStatus }) {
  return (
    <span data-status={status} className={`${badgeBase} ${AIRPORT_STATUS_CLASSES[status]}`}>
      {AIRPORT_STATUS_LABEL[status]}
    </span>
  );
}
