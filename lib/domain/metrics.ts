/**
 * Pure metric computation for the dashboard summary panel (Requirement 1).
 * All predicates are exported for reuse in filtering/view-model composition.
 */
import type {
  DashboardMetrics,
  DashboardSnapshot,
  Flight,
  Incident,
} from "./types";
import { delayMinutes } from "./format";

/** Flight statuses that count as an "active flight". */
export const ACTIVE_STATUSES: ReadonlySet<Flight["status"]> = new Set([
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "EN_ROUTE",
  "DELAYED",
  "DIVERTED",
]);

/** Minutes past scheduled beyond which a non-DELAYED flight still counts as delayed. */
export const DELAY_THRESHOLD_MINUTES = 15;

export function isActive(f: Flight): boolean {
  return ACTIVE_STATUSES.has(f.status);
}

export function isCancelled(f: Flight): boolean {
  return f.status === "CANCELLED";
}

export function isBoarding(f: Flight): boolean {
  return f.status === "BOARDING";
}

/**
 * A flight is delayed if its status is DELAYED, or if its estimated departure
 * is more than DELAY_THRESHOLD_MINUTES past its scheduled departure.
 */
export function isDelayed(f: Flight): boolean {
  if (f.status === "DELAYED") return true;
  const mins = delayMinutes(f.scheduledDeparture, f.estimatedDeparture);
  return mins !== null && mins > DELAY_THRESHOLD_MINUTES;
}

/** An incident is active when OPEN or MONITORING (not RESOLVED). */
export function isActiveIncident(i: Incident): boolean {
  return i.status === "OPEN" || i.status === "MONITORING";
}

export function hasActiveIncident(
  f: Flight,
  activeIncidentIds: ReadonlySet<string>,
): boolean {
  return f.incidentIds.some((id) => activeIncidentIds.has(id));
}

/**
 * A flight is disrupted if its status is DELAYED/CANCELLED/DIVERTED, or it is
 * linked to at least one active incident.
 */
export function isDisrupted(
  f: Flight,
  activeIncidentIds: ReadonlySet<string>,
): boolean {
  return (
    f.status === "DELAYED" ||
    f.status === "CANCELLED" ||
    f.status === "DIVERTED" ||
    hasActiveIncident(f, activeIncidentIds)
  );
}

/** Set of ids for incidents that are currently active. */
export function activeIncidentIdSet(incidents: Incident[]): Set<string> {
  return new Set(incidents.filter(isActiveIncident).map((i) => i.id));
}

/** Compute all eight summary metric values from a snapshot. */
export function computeMetrics(snapshot: DashboardSnapshot): DashboardMetrics {
  const activeIds = activeIncidentIdSet(snapshot.incidents);

  let totalActiveFlights = 0;
  let delayedFlights = 0;
  let cancelledFlights = 0;
  let boardingFlights = 0;
  let flightsWithActiveIncidents = 0;
  let disruptedFlights = 0;

  for (const f of snapshot.flights) {
    if (isActive(f)) totalActiveFlights += 1;
    if (isDelayed(f)) delayedFlights += 1;
    if (isCancelled(f)) cancelledFlights += 1;
    if (isBoarding(f)) boardingFlights += 1;
    if (hasActiveIncident(f, activeIds)) flightsWithActiveIncidents += 1;
    if (isDisrupted(f, activeIds)) disruptedFlights += 1;
  }

  const recentIncidents = snapshot.incidents.filter(isActiveIncident).length;

  return {
    totalActiveFlights,
    delayedFlights,
    cancelledFlights,
    boardingFlights,
    flightsWithActiveIncidents,
    recentIncidents,
    disruptedFlights,
  };
}
