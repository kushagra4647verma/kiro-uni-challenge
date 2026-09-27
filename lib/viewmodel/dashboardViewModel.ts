/**
 * Composes a raw DashboardSnapshot into the derived DashboardViewModel the UI
 * consumes: computed metrics, sorted disrupted-flight view models, sorted
 * active incidents, and sorted (degraded-first) airports.
 *
 * Defensive by design: dangling references (a flight pointing at a missing
 * incident, etc.) are ignored rather than throwing, so malformed backend data
 * cannot crash the UI.
 */
import type {
  DashboardSnapshot,
  DashboardViewModel,
  DisruptedFlightVM,
  Flight,
  Incident,
} from "@/lib/domain/types";
import { computeMetrics, activeIncidentIdSet, isDisrupted } from "@/lib/domain/metrics";
import {
  SEVERITY_RANK,
  sortAirports,
  sortDisruptedFlights,
  sortIncidents,
} from "@/lib/domain/prioritization";
import { highestSeverityActiveIncident } from "@/lib/domain/incidentLinks";
import { delayMinutes, formatDelay } from "@/lib/domain/format";

function toDisruptedFlightVM(
  flight: Flight,
  incidentsById: Map<string, Incident>,
  activeIds: ReadonlySet<string>,
): DisruptedFlightVM {
  const mins = delayMinutes(flight.scheduledDeparture, flight.estimatedDeparture);
  const top = highestSeverityActiveIncident(flight, incidentsById, activeIds);
  return {
    flight,
    delayMinutes: mins,
    delayLabel: formatDelay(mins),
    topIncidentType: top?.type ?? null,
    topIncidentSeverity: top?.severity ?? null,
    priorityKey: top ? SEVERITY_RANK[top.severity] : 0,
  };
}

export function buildDashboardViewModel(
  snapshot: DashboardSnapshot,
): DashboardViewModel {
  const activeIds = activeIncidentIdSet(snapshot.incidents);
  const incidentsById = new Map(snapshot.incidents.map((i) => [i.id, i]));

  const disruptedVMs = snapshot.flights
    .filter((f) => isDisrupted(f, activeIds))
    .map((f) => toDisruptedFlightVM(f, incidentsById, activeIds));

  const activeIncidents = snapshot.incidents.filter((i) => activeIds.has(i.id));

  return {
    metrics: computeMetrics(snapshot),
    disruptedFlights: sortDisruptedFlights(disruptedVMs),
    incidents: sortIncidents(activeIncidents),
    airports: sortAirports(snapshot.airports),
    generatedAt: snapshot.generatedAt,
  };
}
