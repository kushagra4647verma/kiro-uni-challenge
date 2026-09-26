/**
 * Realistic in-memory aviation dataset for the dashboard (Requirement 6.2, 6.6).
 *
 * Coverage guaranteed by mockData.test.ts:
 *  - >= 20 flights spanning every FlightStatus
 *  - >= 5 incidents spanning every Severity and every IncidentStatus
 *  - >= 4 airports including at least one degraded (MAJOR_DELAYS/CLOSED)
 *  - internally consistent flight <-> incident links
 *
 * Timestamps are computed relative to "now" at call time so delays and
 * recency look realistic on every load. buildMockSnapshot() returns a deep
 * clone so callers cannot mutate the underlying fixture.
 */
import type {
  Airport,
  DashboardSnapshot,
  Flight,
  Incident,
} from "@/lib/domain/types";

const MIN = 60 * 1000;

/** ISO timestamp offset from a base time by the given minutes. */
function at(baseMs: number, offsetMin: number): string {
  return new Date(baseMs + offsetMin * MIN).toISOString();
}

function buildAirports(): Airport[] {
  return [
    { code: "JFK", name: "John F. Kennedy International", status: "MAJOR_DELAYS" },
    { code: "ORD", name: "Chicago O'Hare International", status: "CLOSED" },
    { code: "ATL", name: "Hartsfield–Jackson Atlanta International", status: "MINOR_DELAYS" },
    { code: "LAX", name: "Los Angeles International", status: "NORMAL" },
    { code: "DFW", name: "Dallas/Fort Worth International", status: "NORMAL" },
    { code: "DEN", name: "Denver International", status: "MINOR_DELAYS" },
    { code: "SFO", name: "San Francisco International", status: "NORMAL" },
    { code: "MIA", name: "Miami International", status: "NORMAL" },
  ];
}

function buildIncidents(now: number): Incident[] {
  return [
    {
      id: "inc-1",
      title: "Winter storm ground stop at ORD",
      type: "WEATHER",
      severity: "CRITICAL",
      status: "OPEN",
      description:
        "Heavy snow and low visibility have triggered an FAA ground stop at Chicago O'Hare. Arrivals and departures are suspended until conditions improve.",
      affectedFlightIds: ["fl-3", "fl-11", "fl-18"],
      affectedAirportCodes: ["ORD"],
      detectedAt: at(now, -35),
    },
    {
      id: "inc-2",
      title: "Runway 4L/22R closure at JFK",
      type: "GROUND_OPS",
      severity: "HIGH",
      status: "MONITORING",
      description:
        "A disabled aircraft on runway 4L/22R has reduced JFK to a single active runway, causing major departure delays.",
      affectedFlightIds: ["fl-1", "fl-7"],
      affectedAirportCodes: ["JFK"],
      detectedAt: at(now, -70),
    },
    {
      id: "inc-3",
      title: "Hydraulic fault on aircraft N period check",
      type: "TECHNICAL",
      severity: "HIGH",
      status: "OPEN",
      description:
        "Flight crew reported a hydraulic pressure warning during pushback. Aircraft returned to gate for inspection; flight diverted to a replacement tail.",
      affectedFlightIds: ["fl-5"],
      affectedAirportCodes: ["ATL"],
      detectedAt: at(now, -20),
    },
    {
      id: "inc-4",
      title: "Security screening backlog at ATL",
      type: "SECURITY",
      severity: "MEDIUM",
      status: "MONITORING",
      description:
        "A TSA equipment outage caused a temporary screening backlog. Systems are restored; residual delays are being worked down.",
      affectedFlightIds: ["fl-9"],
      affectedAirportCodes: ["ATL"],
      detectedAt: at(now, -110),
    },
    {
      id: "inc-5",
      title: "Crew duty-time timeout on evening bank",
      type: "CREW",
      severity: "MEDIUM",
      status: "OPEN",
      description:
        "Inbound delays have pushed a departing crew against duty-time limits. Reserve crew is being called in.",
      affectedFlightIds: ["fl-13"],
      affectedAirportCodes: ["DEN"],
      detectedAt: at(now, -50),
    },
    {
      id: "inc-6",
      title: "Passenger medical event at gate",
      type: "MEDICAL",
      severity: "LOW",
      status: "RESOLVED",
      description:
        "A passenger required medical attention prior to boarding. Paramedics attended; boarding resumed with a short delay.",
      affectedFlightIds: ["fl-2"],
      affectedAirportCodes: ["LAX"],
      detectedAt: at(now, -180),
    },
    {
      id: "inc-7",
      title: "ATC flow control into JFK metro",
      type: "ATC",
      severity: "LOW",
      status: "MONITORING",
      description:
        "Traffic management initiatives are metering arrivals into the New York metro area, adding minor airborne holding.",
      affectedFlightIds: ["fl-7"],
      affectedAirportCodes: ["JFK"],
      detectedAt: at(now, -25),
    },
  ];
}

function buildFlights(now: number): Flight[] {
  // A spread of statuses; ids fl-1..fl-22. Delay is encoded via estimated vs scheduled.
  return [
    {
      id: "fl-1",
      flightNumber: "AA118",
      airline: "American Airlines",
      origin: "JFK",
      destination: "LAX",
      scheduledDeparture: at(now, 20),
      estimatedDeparture: at(now, 115), // ~95m late
      status: "DELAYED",
      incidentIds: ["inc-2"],
    },
    {
      id: "fl-2",
      flightNumber: "DL452",
      airline: "Delta Air Lines",
      origin: "LAX",
      destination: "SFO",
      scheduledDeparture: at(now, 40),
      estimatedDeparture: at(now, 55),
      status: "BOARDING",
      incidentIds: ["inc-6"], // resolved incident
    },
    {
      id: "fl-3",
      flightNumber: "UA890",
      airline: "United Airlines",
      origin: "ORD",
      destination: "DEN",
      scheduledDeparture: at(now, 10),
      estimatedDeparture: null,
      status: "CANCELLED",
      incidentIds: ["inc-1"],
    },
    {
      id: "fl-4",
      flightNumber: "SW221",
      airline: "Southwest Airlines",
      origin: "DFW",
      destination: "MIA",
      scheduledDeparture: at(now, 60),
      estimatedDeparture: at(now, 60),
      status: "SCHEDULED",
      incidentIds: [],
    },
    {
      id: "fl-5",
      flightNumber: "AA732",
      airline: "American Airlines",
      origin: "ATL",
      destination: "JFK",
      scheduledDeparture: at(now, -15),
      estimatedDeparture: at(now, 45),
      status: "DIVERTED",
      incidentIds: ["inc-3"],
    },
    {
      id: "fl-6",
      flightNumber: "DL199",
      airline: "Delta Air Lines",
      origin: "ATL",
      destination: "LAX",
      scheduledDeparture: at(now, -120),
      estimatedDeparture: at(now, -118),
      status: "EN_ROUTE",
      incidentIds: [],
    },
    {
      id: "fl-7",
      flightNumber: "B6615",
      airline: "JetBlue Airways",
      origin: "JFK",
      destination: "SFO",
      scheduledDeparture: at(now, 30),
      estimatedDeparture: at(now, 95), // 65m late
      status: "DELAYED",
      incidentIds: ["inc-2", "inc-7"],
    },
    {
      id: "fl-8",
      flightNumber: "UA455",
      airline: "United Airlines",
      origin: "SFO",
      destination: "ORD",
      scheduledDeparture: at(now, -200),
      estimatedDeparture: at(now, -205),
      status: "LANDED",
      incidentIds: [],
    },
    {
      id: "fl-9",
      flightNumber: "AA980",
      airline: "American Airlines",
      origin: "ATL",
      destination: "DFW",
      scheduledDeparture: at(now, 25),
      estimatedDeparture: at(now, 70), // 45m late
      status: "DELAYED",
      incidentIds: ["inc-4"],
    },
    {
      id: "fl-10",
      flightNumber: "DL777",
      airline: "Delta Air Lines",
      origin: "MIA",
      destination: "ATL",
      scheduledDeparture: at(now, 90),
      estimatedDeparture: at(now, 90),
      status: "SCHEDULED",
      incidentIds: [],
    },
    {
      id: "fl-11",
      flightNumber: "UA321",
      airline: "United Airlines",
      origin: "ORD",
      destination: "LAX",
      scheduledDeparture: at(now, 15),
      estimatedDeparture: null,
      status: "CANCELLED",
      incidentIds: ["inc-1"],
    },
    {
      id: "fl-12",
      flightNumber: "SW640",
      airline: "Southwest Airlines",
      origin: "DEN",
      destination: "DFW",
      scheduledDeparture: at(now, 5),
      estimatedDeparture: at(now, 8),
      status: "DEPARTED",
      incidentIds: [],
    },
    {
      id: "fl-13",
      flightNumber: "F9210",
      airline: "Frontier Airlines",
      origin: "DEN",
      destination: "SFO",
      scheduledDeparture: at(now, 35),
      estimatedDeparture: at(now, 100), // 65m late
      status: "DELAYED",
      incidentIds: ["inc-5"],
    },
    {
      id: "fl-14",
      flightNumber: "AA260",
      airline: "American Airlines",
      origin: "DFW",
      destination: "JFK",
      scheduledDeparture: at(now, 50),
      estimatedDeparture: at(now, 50),
      status: "BOARDING",
      incidentIds: [],
    },
    {
      id: "fl-15",
      flightNumber: "DL512",
      airline: "Delta Air Lines",
      origin: "LAX",
      destination: "MIA",
      scheduledDeparture: at(now, -260),
      estimatedDeparture: at(now, -255),
      status: "ARRIVED",
      incidentIds: [],
    },
    {
      id: "fl-16",
      flightNumber: "UA118",
      airline: "United Airlines",
      origin: "SFO",
      destination: "DEN",
      scheduledDeparture: at(now, 75),
      estimatedDeparture: at(now, 75),
      status: "SCHEDULED",
      incidentIds: [],
    },
    {
      id: "fl-17",
      flightNumber: "B6402",
      airline: "JetBlue Airways",
      origin: "MIA",
      destination: "JFK",
      scheduledDeparture: at(now, -30),
      estimatedDeparture: at(now, -25),
      status: "EN_ROUTE",
      incidentIds: [],
    },
    {
      id: "fl-18",
      flightNumber: "UA905",
      airline: "United Airlines",
      origin: "ORD",
      destination: "ATL",
      scheduledDeparture: at(now, 8),
      estimatedDeparture: null,
      status: "CANCELLED",
      incidentIds: ["inc-1"],
    },
    {
      id: "fl-19",
      flightNumber: "SW118",
      airline: "Southwest Airlines",
      origin: "DFW",
      destination: "DEN",
      scheduledDeparture: at(now, 12),
      estimatedDeparture: at(now, 14),
      status: "DEPARTED",
      incidentIds: [],
    },
    {
      id: "fl-20",
      flightNumber: "AA640",
      airline: "American Airlines",
      origin: "JFK",
      destination: "MIA",
      scheduledDeparture: at(now, 100),
      estimatedDeparture: at(now, 100),
      status: "SCHEDULED",
      incidentIds: [],
    },
    {
      id: "fl-21",
      flightNumber: "DL318",
      airline: "Delta Air Lines",
      origin: "ATL",
      destination: "SFO",
      scheduledDeparture: at(now, 45),
      estimatedDeparture: at(now, 52),
      status: "BOARDING",
      incidentIds: [],
    },
    {
      id: "fl-22",
      flightNumber: "UA744",
      airline: "United Airlines",
      origin: "DEN",
      destination: "ORD",
      scheduledDeparture: at(now, -80),
      estimatedDeparture: at(now, -78),
      status: "LANDED",
      incidentIds: [],
    },
  ];
}

/** Produce a fresh, deep-cloned snapshot anchored to the current time. */
export function buildMockSnapshot(now: number = Date.now()): DashboardSnapshot {
  const snapshot: DashboardSnapshot = {
    flights: buildFlights(now),
    incidents: buildIncidents(now),
    airports: buildAirports(),
    generatedAt: new Date(now).toISOString(),
  };
  // Deep clone so callers cannot mutate the fixture between reads.
  return structuredClone(snapshot);
}
