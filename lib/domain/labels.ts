/**
 * Human-readable labels for enum values. Keeps display strings out of
 * components and ensures consistent wording across the UI.
 */
import type {
  AirportOpStatus,
  FlightStatus,
  IncidentStatus,
  IncidentType,
  Severity,
} from "./types";

export const SEVERITY_LABEL: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const FLIGHT_STATUS_LABEL: Record<FlightStatus, string> = {
  SCHEDULED: "Scheduled",
  BOARDING: "Boarding",
  DEPARTED: "Departed",
  EN_ROUTE: "En route",
  DELAYED: "Delayed",
  DIVERTED: "Diverted",
  CANCELLED: "Cancelled",
  LANDED: "Landed",
  ARRIVED: "Arrived",
};

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  WEATHER: "Weather",
  TECHNICAL: "Technical",
  SECURITY: "Security",
  CREW: "Crew",
  ATC: "ATC",
  MEDICAL: "Medical",
  GROUND_OPS: "Ground ops",
  OTHER: "Other",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: "Open",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
};

export const AIRPORT_STATUS_LABEL: Record<AirportOpStatus, string> = {
  NORMAL: "Normal",
  MINOR_DELAYS: "Minor delays",
  MAJOR_DELAYS: "Major delays",
  CLOSED: "Closed",
};
