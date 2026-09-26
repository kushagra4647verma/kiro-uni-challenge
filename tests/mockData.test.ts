import { describe, it, expect } from "vitest";
import { buildMockSnapshot } from "@/lib/data/mock/mockData";
import type {
  FlightStatus,
  IncidentStatus,
  Severity,
} from "@/lib/domain/types";

const ALL_FLIGHT_STATUSES: FlightStatus[] = [
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "EN_ROUTE",
  "DELAYED",
  "DIVERTED",
  "CANCELLED",
  "LANDED",
  "ARRIVED",
];

const ALL_SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ALL_INCIDENT_STATUSES: IncidentStatus[] = ["OPEN", "MONITORING", "RESOLVED"];

describe("mock dataset coverage (Requirement 6.6)", () => {
  const snap = buildMockSnapshot();

  it("has at least 20 flights", () => {
    expect(snap.flights.length).toBeGreaterThanOrEqual(20);
  });

  it("spans every flight status", () => {
    const present = new Set(snap.flights.map((f) => f.status));
    for (const s of ALL_FLIGHT_STATUSES) {
      expect(present.has(s), `missing flight status ${s}`).toBe(true);
    }
  });

  it("has at least 5 incidents spanning every severity", () => {
    expect(snap.incidents.length).toBeGreaterThanOrEqual(5);
    const present = new Set(snap.incidents.map((i) => i.severity));
    for (const s of ALL_SEVERITIES) {
      expect(present.has(s), `missing severity ${s}`).toBe(true);
    }
  });

  it("includes every incident status at least once", () => {
    const present = new Set(snap.incidents.map((i) => i.status));
    for (const s of ALL_INCIDENT_STATUSES) {
      expect(present.has(s), `missing incident status ${s}`).toBe(true);
    }
  });

  it("has at least 4 airports including at least one degraded", () => {
    expect(snap.airports.length).toBeGreaterThanOrEqual(4);
    const degraded = snap.airports.filter(
      (a) => a.status === "MAJOR_DELAYS" || a.status === "CLOSED",
    );
    expect(degraded.length).toBeGreaterThanOrEqual(1);
  });
});

describe("mock dataset referential integrity", () => {
  const snap = buildMockSnapshot();
  const flightIds = new Set(snap.flights.map((f) => f.id));
  const incidentIds = new Set(snap.incidents.map((i) => i.id));
  const airportCodes = new Set(snap.airports.map((a) => a.code));

  it("every flight incidentId resolves to an incident", () => {
    for (const f of snap.flights) {
      for (const id of f.incidentIds) {
        expect(incidentIds.has(id), `flight ${f.id} -> missing incident ${id}`).toBe(true);
      }
    }
  });

  it("every incident affectedFlightId resolves to a flight", () => {
    for (const i of snap.incidents) {
      for (const id of i.affectedFlightIds) {
        expect(flightIds.has(id), `incident ${i.id} -> missing flight ${id}`).toBe(true);
      }
    }
  });

  it("every incident affectedAirportCode resolves to an airport", () => {
    for (const i of snap.incidents) {
      for (const code of i.affectedAirportCodes) {
        expect(airportCodes.has(code), `incident ${i.id} -> missing airport ${code}`).toBe(true);
      }
    }
  });

  it("every flight origin and destination resolves to an airport", () => {
    for (const f of snap.flights) {
      expect(airportCodes.has(f.origin), `flight ${f.id} origin ${f.origin}`).toBe(true);
      expect(airportCodes.has(f.destination), `flight ${f.id} dest ${f.destination}`).toBe(true);
    }
  });

  it("returns a distinct clone on each call (no shared mutation)", () => {
    const a = buildMockSnapshot();
    const b = buildMockSnapshot();
    a.flights[0].flightNumber = "MUTATED";
    expect(b.flights[0].flightNumber).not.toBe("MUTATED");
  });
});
