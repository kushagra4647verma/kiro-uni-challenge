import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/lib/domain/metrics";
import type { DashboardSnapshot, Flight, Incident } from "@/lib/domain/types";

const NOW = Date.parse("2026-01-01T12:00:00Z");
const iso = (offsetMin: number) => new Date(NOW + offsetMin * 60000).toISOString();

function flight(partial: Partial<Flight> & Pick<Flight, "id" | "status">): Flight {
  return {
    flightNumber: partial.id,
    airline: "Test Air",
    origin: "AAA",
    destination: "BBB",
    scheduledDeparture: iso(0),
    estimatedDeparture: iso(0),
    incidentIds: [],
    ...partial,
  };
}

function incident(
  partial: Partial<Incident> & Pick<Incident, "id" | "status">,
): Incident {
  return {
    title: "t",
    type: "OTHER",
    severity: "LOW",
    description: "d",
    affectedFlightIds: [],
    affectedAirportCodes: [],
    detectedAt: iso(-30),
    ...partial,
  };
}

describe("computeMetrics", () => {
  it("counts each metric per its definition", () => {
    const incidents: Incident[] = [
      incident({ id: "inc-open", status: "OPEN" }),
      incident({ id: "inc-monitoring", status: "MONITORING" }),
      incident({ id: "inc-resolved", status: "RESOLVED" }),
    ];

    const flights: Flight[] = [
      // active (SCHEDULED)
      flight({ id: "f1", status: "SCHEDULED" }),
      // active + boarding
      flight({ id: "f2", status: "BOARDING" }),
      // active + delayed by status
      flight({ id: "f3", status: "DELAYED" }),
      // active + delayed by >15m rule (EN_ROUTE, 20m late)
      flight({
        id: "f4",
        status: "EN_ROUTE",
        scheduledDeparture: iso(0),
        estimatedDeparture: iso(20),
      }),
      // NOT delayed: only 10m late (under threshold)
      flight({
        id: "f5",
        status: "SCHEDULED",
        scheduledDeparture: iso(0),
        estimatedDeparture: iso(10),
      }),
      // cancelled (not active), disrupted
      flight({ id: "f6", status: "CANCELLED" }),
      // diverted (active), disrupted
      flight({ id: "f7", status: "DIVERTED" }),
      // linked to an active incident -> disrupted + withActiveIncident
      flight({ id: "f8", status: "SCHEDULED", incidentIds: ["inc-open"] }),
      // linked only to a RESOLVED incident -> NOT withActiveIncident, NOT disrupted by that
      flight({ id: "f9", status: "SCHEDULED", incidentIds: ["inc-resolved"] }),
      // landed (not active, not disrupted)
      flight({ id: "f10", status: "LANDED" }),
    ];

    const snapshot: DashboardSnapshot = {
      flights,
      incidents,
      airports: [],
      generatedAt: iso(0),
    };

    const m = computeMetrics(snapshot);

    // active: f1,f2,f3,f4,f5,f7,f8,f9 = 8 (f6 cancelled, f10 landed excluded)
    expect(m.totalActiveFlights).toBe(8);
    // delayed: f3 (status), f4 (>15m) = 2
    expect(m.delayedFlights).toBe(2);
    // cancelled: f6 = 1
    expect(m.cancelledFlights).toBe(1);
    // boarding: f2 = 1
    expect(m.boardingFlights).toBe(1);
    // with active incident: f8 = 1 (f9 is resolved-only)
    expect(m.flightsWithActiveIncidents).toBe(1);
    // recent (active) incidents: open + monitoring = 2
    expect(m.recentIncidents).toBe(2);
    // disrupted: f3(DELAYED), f6(CANCELLED), f7(DIVERTED), f8(active incident) = 4
    expect(m.disruptedFlights).toBe(4);
  });

  it("returns 0 (not blank) for all metrics on an empty snapshot", () => {
    const m = computeMetrics({
      flights: [],
      incidents: [],
      airports: [],
      generatedAt: iso(0),
    });
    expect(m).toEqual({
      totalActiveFlights: 0,
      delayedFlights: 0,
      cancelledFlights: 0,
      boardingFlights: 0,
      flightsWithActiveIncidents: 0,
      recentIncidents: 0,
      disruptedFlights: 0,
    });
  });
});
