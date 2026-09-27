/**
 * Flight Disruption Intelligence — the canonical, framework-independent surface
 * for AeroOps' flight operational rules.
 *
 * This module is the single import point for disruption logic. It re-exports
 * the existing authoritative implementations (it does NOT redefine any rule or
 * type) plus the extracted highest-severity-linked-incident helper. Consumers
 * — the dashboard today, alerts and the future FastAPI backend later — apply
 * identical rules by importing from here.
 *
 *   1. Active-flight classification        -> isActive / ACTIVE_STATUSES
 *   2. Delayed-flight classification        -> isDelayed / DELAY_THRESHOLD_MINUTES
 *   3. Delay-duration calculation           -> delayMinutes
 *   4. Disrupted-flight classification       -> isDisrupted / hasActiveIncident
 *   5. Incident severity prioritization      -> SEVERITY_RANK / highestSeverityActiveIncident
 *   6. Disrupted-flight prioritization        -> sortDisruptedFlights
 *   7. Deterministic ordering                -> sortDisruptedFlights / sortIncidents
 */

export {
  ACTIVE_STATUSES,
  DELAY_THRESHOLD_MINUTES,
  isActive,
  isDelayed,
  isCancelled,
  isBoarding,
  isActiveIncident,
  hasActiveIncident,
  isDisrupted,
  activeIncidentIdSet,
} from "./metrics";

export { delayMinutes } from "./format";

export {
  SEVERITY_RANK,
  FLIGHT_DISRUPTION_RANK,
  sortDisruptedFlights,
  sortIncidents,
} from "./prioritization";

export { highestSeverityActiveIncident } from "./incidentLinks";
