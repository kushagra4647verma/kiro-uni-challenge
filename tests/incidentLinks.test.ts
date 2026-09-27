import { describe, it, expect } from "vitest";
import { highestSeverityActiveIncident } from "@/lib/domain/incidentLinks";
import type { Flight, Incident } from "@/lib/domain/types";

const iso = (min: number) =>
  new Date(Date.parse("2026-01-01T12:00:00Z") + min * 60000).toISOString();

function flight(incidentIds: string[]): Flight {
  return {
    id: "f1",
    flightNumber: "AA1",
    airline: "Test Air",
    origin: "AAA",
    destination: "BBB",
    scheduledDeparture: iso(0),
    estimatedDeparture: iso(0),
    status: "SCHEDULED",
    incidentIds,
  };
}

function incident(p: Partial<Incident> & Pick<Incident, "id" | "severity">): Incident {
  return {
    title: p.id,
    type: "OTHER",
    status: "OPEN",
    description: "",
    affectedFlightIds: [],
    affectedAirportCodes: [],
    detectedAt: iso(-10),
    ...p,
  };
}

describe("highestSeverityActiveIncident", () => {
  it("returns the highest-severity linked active incident", () => {
    const incidents = [
      incident({ id: "a", severity: "HIGH" }),
      incident({ id: "b", severity: "CRITICAL" }),
      incident({ id: "c", severity: "MEDIUM" }),
    ];
    const byId = new Map(incidents.map((i) => [i.id, i]));
    const active = new Set(["a", "b", "c"]);
    const result = highestSeverityActiveIncident(flight(["a", "b", "c"]), byId, active);
    expect(result?.id).toBe("b");
  });

  it("skips incidents that are not in the active set (e.g. resolved)", () => {
    const incidents = [
      incident({ id: "a", severity: "HIGH" }),
      incident({ id: "resolved", severity: "CRITICAL", status: "RESOLVED" }),
    ];
    const byId = new Map(incidents.map((i) => [i.id, i]));
    const active = new Set(["a"]); // "resolved" intentionally excluded
    const result = highestSeverityActiveIncident(flight(["a", "resolved"]), byId, active);
    expect(result?.id).toBe("a");
  });

  it("ignores dangling incident references without throwing", () => {
    const incidents = [incident({ id: "a", severity: "LOW" })];
    const byId = new Map(incidents.map((i) => [i.id, i]));
    const active = new Set(["a", "ghost"]); // "ghost" not in byId
    const result = highestSeverityActiveIncident(flight(["ghost", "a"]), byId, active);
    expect(result?.id).toBe("a");
  });

  it("returns null when there is no linked active incident", () => {
    const byId = new Map<string, Incident>();
    const result = highestSeverityActiveIncident(flight([]), byId, new Set());
    expect(result).toBeNull();
  });

  it("does not mutate the flight's incidentIds", () => {
    const ids = ["a", "b"];
    const incidents = [
      incident({ id: "a", severity: "LOW" }),
      incident({ id: "b", severity: "HIGH" }),
    ];
    const byId = new Map(incidents.map((i) => [i.id, i]));
    highestSeverityActiveIncident(flight(ids), byId, new Set(["a", "b"]));
    expect(ids).toEqual(["a", "b"]);
  });
});
