/**
 * Pure domain logic for resolving the relationship between a flight and its
 * linked incidents. Framework-independent (no React/Next imports).
 *
 * Extracted from the dashboard view model so the rule "which active incident
 * makes this flight most critical" is reusable across features (dashboard,
 * alerts, future backend) from a single source of truth.
 */
import type { Flight, Incident } from "./types";
import { SEVERITY_RANK } from "./prioritization";

/**
 * The highest-severity active incident linked to a flight, or null when the
 * flight has no resolvable linked active incident.
 *
 * Only incident ids present in `activeIncidentIds` are considered; resolved
 * incidents and dangling references (ids not found in `incidentsById`) are
 * ignored rather than throwing. Inputs are not mutated.
 */
export function highestSeverityActiveIncident(
  flight: Flight,
  incidentsById: ReadonlyMap<string, Incident>,
  activeIncidentIds: ReadonlySet<string>,
): Incident | null {
  let top: Incident | null = null;
  for (const id of flight.incidentIds) {
    if (!activeIncidentIds.has(id)) continue;
    const incident = incidentsById.get(id);
    if (!incident) continue; // dangling reference — ignore
    if (!top || SEVERITY_RANK[incident.severity] > SEVERITY_RANK[top.severity]) {
      top = incident;
    }
  }
  return top;
}
