/**
 * Shared domain models for the AeroOps Flight Operations Dashboard.
 *
 * These types are the single source of truth for the data contract. Both the
 * mock data source (this iteration) and any future backend adapter (FastAPI +
 * MongoDB) must produce values conforming to these shapes. Timestamps are ISO
 * 8601 strings so the contract is JSON/HTTP- and MongoDB-friendly.
 */

// --- Enums (as string unions for zero-runtime-cost, serialization-friendly types) ---

export type FlightStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "EN_ROUTE"
  | "DELAYED"
  | "DIVERTED"
  | "CANCELLED"
  | "LANDED"
  | "ARRIVED";

export type IncidentType =
  | "WEATHER"
  | "TECHNICAL"
  | "SECURITY"
  | "CREW"
  | "ATC"
  | "MEDICAL"
  | "GROUND_OPS"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus = "OPEN" | "MONITORING" | "RESOLVED";

export type AirportOpStatus = "NORMAL" | "MINOR_DELAYS" | "MAJOR_DELAYS" | "CLOSED";

// --- Core entities ---

export interface Airport {
  code: string; // IATA, e.g. "JFK"
  name: string;
  status: AirportOpStatus;
}

export interface Flight {
  id: string;
  flightNumber: string; // e.g. "AA123"
  airline: string;
  origin: string; // airport code
  destination: string; // airport code
  scheduledDeparture: string; // ISO 8601
  estimatedDeparture: string | null; // ISO 8601, or null when unknown
  status: FlightStatus;
  incidentIds: string[]; // references to Incident.id (0..n)
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  affectedFlightIds: string[]; // Flight.id references
  affectedAirportCodes: string[]; // Airport.code references
  detectedAt: string; // ISO 8601
}

/** The single aggregated payload the dashboard reads. */
export interface DashboardSnapshot {
  flights: Flight[];
  incidents: Incident[];
  airports: Airport[];
  generatedAt: string; // ISO 8601 — when the snapshot was produced
}

// --- Derived view model (computed by pure functions, never stored) ---

export interface DashboardMetrics {
  totalActiveFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  boardingFlights: number;
  flightsWithActiveIncidents: number;
  recentIncidents: number;
  disruptedFlights: number;
}

export interface DisruptedFlightVM {
  flight: Flight;
  delayMinutes: number | null; // null => "N/A"
  delayLabel: string; // "1h 20m" | "45m" | "N/A"
  topIncidentType: IncidentType | null; // null => "None"
  topIncidentSeverity: Severity | null; // null => "None"
  priorityKey: number; // higher = more urgent (for deterministic sorting)
}

export interface DashboardViewModel {
  metrics: DashboardMetrics;
  disruptedFlights: DisruptedFlightVM[]; // pre-sorted, most urgent first
  incidents: Incident[]; // active incidents, pre-sorted
  airports: Airport[]; // pre-sorted, degraded first
  generatedAt: string;
}
