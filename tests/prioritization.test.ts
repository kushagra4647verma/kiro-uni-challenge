import { describe, it, expect } from "vitest";
import {
  sortIncidents,
  sortDisruptedFlights,
  sortAirports,
} from "@/lib/domain/prioritization";
import type {
  Airport,
  DisruptedFlightVM,
  Flight,
  Incident,
} from "@/lib/domain/types";

const iso = (min: number) =>
  new Date(Date.parse("2026-01-01T12:00:00Z") + min * 60000).toISOString();

function inc(
  p: Partial<Incident> & Pick<Incident, "id" | "severity">,
): Incident {
  return {
    title: p.id,
    type: "OTHER",
    status: "OPEN",
    description: "",
    affectedFlightIds: [],
    affectedAirportCodes: [],
    detectedAt: iso(0),
    ...p,
  };
}

function vm(p: {
  id: string;
  status: Flight["status"];
  severity?: DisruptedFlightVM["topIncidentSeverity"];
  delay?: number | null;
}): DisruptedFlightVM {
  const flight: Flight = {
    id: p.id,
    flightNumber: p.id,
    airline: "X",
    origin: "AAA",
    destination: "BBB",
    scheduledDeparture: iso(0),
    estimatedDeparture: iso(0),
    status: p.status,
    incidentIds: [],
  };
  return {
    flight,
    delayMinutes: p.delay ?? null,
    delayLabel: "",
    topIncidentType: null,
    topIncidentSeverity: p.severity ?? null,
    priorityKey: 0,
  };
}

describe("sortIncidents", () => {
  it("orders by severity desc, then detectedAt desc, then id asc", () => {
    const result = sortIncidents([
      inc({ id: "a", severity: "LOW", detectedAt: iso(0) }),
      inc({ id: "b", severity: "CRITICAL", detectedAt: iso(-60) }),
      inc({ id: "c", severity: "CRITICAL", detectedAt: iso(-10) }),
      inc({ id: "d", severity: "HIGH", detectedAt: iso(0) }),
    ]);
    expect(result.map((i) => i.id)).toEqual(["c", "b", "d", "a"]);
  });

  it("uses id ascending as a stable tiebreaker on equal severity+time", () => {
    const result = sortIncidents([
      inc({ id: "z", severity: "HIGH", detectedAt: iso(0) }),
      inc({ id: "a", severity: "HIGH", detectedAt: iso(0) }),
    ]);
    expect(result.map((i) => i.id)).toEqual(["a", "z"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      inc({ id: "a", severity: "LOW" }),
      inc({ id: "b", severity: "CRITICAL" }),
    ];
    const before = input.map((i) => i.id);
    sortIncidents(input);
    expect(input.map((i) => i.id)).toEqual(before);
  });
});

describe("sortDisruptedFlights", () => {
  it("orders by incident severity, then disruption type, then delay desc, then id", () => {
    const result = sortDisruptedFlights([
      vm({ id: "f-delayed-30", status: "DELAYED", delay: 30 }),
      vm({ id: "f-critical", status: "DELAYED", severity: "CRITICAL", delay: 5 }),
      vm({ id: "f-cancelled", status: "CANCELLED", delay: null }),
      vm({ id: "f-diverted", status: "DIVERTED", delay: null }),
      vm({ id: "f-delayed-90", status: "DELAYED", delay: 90 }),
    ]);
    expect(result.map((v) => v.flight.id)).toEqual([
      "f-critical", // highest incident severity wins
      "f-cancelled", // no incident: CANCELLED > DIVERTED > DELAYED
      "f-diverted",
      "f-delayed-90", // among DELAYED, longer delay first
      "f-delayed-30",
    ]);
  });

  it("uses id ascending as a stable tiebreaker", () => {
    const result = sortDisruptedFlights([
      vm({ id: "f-z", status: "DELAYED", delay: 10 }),
      vm({ id: "f-a", status: "DELAYED", delay: 10 }),
    ]);
    expect(result.map((v) => v.flight.id)).toEqual(["f-a", "f-z"]);
  });
});

describe("sortAirports", () => {
  const ap = (code: string, status: Airport["status"]): Airport => ({
    code,
    name: code,
    status,
  });

  it("orders degraded airports first (CLOSED, then MAJOR_DELAYS), then code asc", () => {
    const result = sortAirports([
      ap("NRM", "NORMAL"),
      ap("MAJ", "MAJOR_DELAYS"),
      ap("CLO", "CLOSED"),
      ap("MIN", "MINOR_DELAYS"),
    ]);
    expect(result.map((a) => a.code)).toEqual(["CLO", "MAJ", "MIN", "NRM"]);
  });

  it("breaks ties by code ascending", () => {
    const result = sortAirports([
      ap("ZZZ", "NORMAL"),
      ap("AAA", "NORMAL"),
    ]);
    expect(result.map((a) => a.code)).toEqual(["AAA", "ZZZ"]);
  });
});
