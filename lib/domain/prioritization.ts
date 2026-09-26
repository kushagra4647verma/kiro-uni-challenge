/**
 * Pure prioritization / ordering logic (Requirement 4). Every sort returns a
 * new array (no mutation) and ends with an ascending id/code tiebreaker so that
 * identical data always renders in an identical, deterministic order.
 */
import type {
  Airport,
  DisruptedFlightVM,
  Incident,
  Severity,
} from "./types";

/** Single source of truth for severity ordering (higher = more urgent). */
export const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/** Disruption ranking for flight status (higher = more urgent). */
export const FLIGHT_DISRUPTION_RANK: Record<string, number> = {
  CANCELLED: 3,
  DIVERTED: 2,
  DELAYED: 1,
};

/** Degraded-first ranking for airports (higher = shown earlier). */
export const AIRPORT_DEGRADED_RANK: Record<string, number> = {
  CLOSED: 3,
  MAJOR_DELAYS: 2,
  MINOR_DELAYS: 1,
  NORMAL: 0,
};

/**
 * Incidents: severity desc, then more recently detected first, then id asc.
 */
export function sortIncidents(incidents: Incident[]): Incident[] {
  return [...incidents].sort((a, b) => {
    const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (sev !== 0) return sev;
    const time = Date.parse(b.detectedAt) - Date.parse(a.detectedAt);
    if (time !== 0) return time;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Disrupted flights: highest linked-incident severity first, then disruption
 * type (CANCELLED > DIVERTED > DELAYED), then longest delay first, then id asc.
 */
export function sortDisruptedFlights(
  vms: DisruptedFlightVM[],
): DisruptedFlightVM[] {
  return [...vms].sort((a, b) => {
    const sevA = a.topIncidentSeverity ? SEVERITY_RANK[a.topIncidentSeverity] : 0;
    const sevB = b.topIncidentSeverity ? SEVERITY_RANK[b.topIncidentSeverity] : 0;
    if (sevB !== sevA) return sevB - sevA;

    const disA = FLIGHT_DISRUPTION_RANK[a.flight.status] ?? 0;
    const disB = FLIGHT_DISRUPTION_RANK[b.flight.status] ?? 0;
    if (disB !== disA) return disB - disA;

    const delayA = a.delayMinutes ?? -Infinity;
    const delayB = b.delayMinutes ?? -Infinity;
    if (delayB !== delayA) return delayB - delayA;

    return a.flight.id.localeCompare(b.flight.id);
  });
}

/**
 * Airports: degraded first (CLOSED, then MAJOR_DELAYS, ...), then code asc.
 */
export function sortAirports(airports: Airport[]): Airport[] {
  return [...airports].sort((a, b) => {
    const rank = (AIRPORT_DEGRADED_RANK[b.status] ?? 0) - (AIRPORT_DEGRADED_RANK[a.status] ?? 0);
    if (rank !== 0) return rank;
    return a.code.localeCompare(b.code);
  });
}

/** Whether an airport status is considered degraded (for UI marking). */
export function isDegradedAirport(status: Airport["status"]): boolean {
  return status === "MAJOR_DELAYS" || status === "CLOSED";
}
