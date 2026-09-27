import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  isActive,
  isDelayed,
  isDisrupted,
  delayMinutes,
  SEVERITY_RANK,
  sortDisruptedFlights,
  sortIncidents,
  activeIncidentIdSet,
} from "@/lib/domain/disruption";
import { DELAY_THRESHOLD_MINUTES } from "@/lib/domain/metrics";
import type {
  DisruptedFlightVM,
  Flight,
  FlightStatus,
  Incident,
  Severity,
} from "@/lib/domain/types";

// --- Arbitraries for valid domain values -----------------------------------

const FLIGHT_STATUSES: FlightStatus[] = [
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
const NON_ACTIVE: FlightStatus[] = ["CANCELLED", "LANDED", "ARRIVED"];
const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const BASE_MS = Date.parse("2026-01-01T12:00:00Z");
const isoFromOffset = (min: number) => new Date(BASE_MS + min * 60000).toISOString();

const flightStatusArb = fc.constantFrom(...FLIGHT_STATUSES);
const severityArb = fc.constantFrom(...SEVERITIES);

/** A valid Flight with parseable timestamps and a nullable estimated departure. */
const flightArb = (): fc.Arbitrary<Flight> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    schedOffset: fc.integer({ min: -240, max: 240 }),
    estDelta: fc.option(fc.integer({ min: -120, max: 240 }), { nil: null }),
    status: flightStatusArb,
    incidentIds: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { maxLength: 4 }),
  }).map(({ id, schedOffset, estDelta, status, incidentIds }) => ({
    id,
    flightNumber: `X${id}`,
    airline: "Prop Air",
    origin: "AAA",
    destination: "BBB",
    scheduledDeparture: isoFromOffset(schedOffset),
    estimatedDeparture: estDelta === null ? null : isoFromOffset(schedOffset + estDelta),
    status,
    incidentIds,
  }));

const incidentArb = (): fc.Arbitrary<Incident> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    severity: severityArb,
    detOffset: fc.integer({ min: -300, max: 0 }),
  }).map(({ id, severity, detOffset }) => ({
    id,
    title: id,
    type: "OTHER" as const,
    severity,
    status: "OPEN" as const,
    description: "",
    affectedFlightIds: [],
    affectedAirportCodes: [],
    detectedAt: isoFromOffset(detOffset),
  }));

/** A DisruptedFlightVM with arbitrary ranking keys (for pure ordering tests). */
const vmArb = (): fc.Arbitrary<DisruptedFlightVM> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    status: fc.constantFrom<FlightStatus>("DELAYED", "CANCELLED", "DIVERTED"),
    severity: fc.option(severityArb, { nil: null }),
    delay: fc.option(fc.integer({ min: 0, max: 600 }), { nil: null }),
  }).map(({ id, status, severity, delay }) => ({
    flight: {
      id,
      flightNumber: `X${id}`,
      airline: "Prop Air",
      origin: "AAA",
      destination: "BBB",
      scheduledDeparture: isoFromOffset(0),
      estimatedDeparture: delay === null ? null : isoFromOffset(delay),
      status,
      incidentIds: [],
    },
    delayMinutes: delay,
    delayLabel: "",
    topIncidentType: null,
    topIncidentSeverity: severity,
    priorityKey: severity ? SEVERITY_RANK[severity] : 0,
  }));

const snapshot = (obj: unknown) => JSON.parse(JSON.stringify(obj));

// --- Properties -------------------------------------------------------------

describe("P1: isActive iff status not in {CANCELLED, LANDED, ARRIVED}", () => {
  it("holds for all flights", () => {
    fc.assert(
      fc.property(flightArb(), (f) => {
        expect(isActive(f)).toBe(!NON_ACTIVE.includes(f.status));
      }),
    );
  });
});

describe("P2: delay monotonicity + threshold flip for non-DELAYED flights", () => {
  it("is monotonic non-decreasing in estimated departure and flips at >15m", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<FlightStatus>("SCHEDULED", "BOARDING", "EN_ROUTE"),
        fc.integer({ min: -60, max: 60 }),
        fc.integer({ min: 0, max: 300 }),
        (status, schedOffset, lateBy) => {
          const base: Flight = {
            id: "m",
            flightNumber: "Xm",
            airline: "Prop Air",
            origin: "AAA",
            destination: "BBB",
            scheduledDeparture: isoFromOffset(schedOffset),
            estimatedDeparture: isoFromOffset(schedOffset + lateBy),
            status,
            incidentIds: [],
          };
          const expected = lateBy > DELAY_THRESHOLD_MINUTES;
          expect(isDelayed(base)).toBe(expected);

          // Monotonic: pushing estimated later never turns delayed off.
          const later: Flight = {
            ...base,
            estimatedDeparture: isoFromOffset(schedOffset + lateBy + 30),
          };
          if (isDelayed(base)) expect(isDelayed(later)).toBe(true);
        },
      ),
    );
  });

  it("classifies DELAYED status as delayed regardless of timestamps", () => {
    fc.assert(
      fc.property(flightArb(), (f) => {
        if (f.status === "DELAYED") expect(isDelayed(f)).toBe(true);
      }),
    );
  });
});

describe("P3: delay-duration consistency and null cases", () => {
  it("returns rounded diff when computable and null exactly when estimated is null", () => {
    fc.assert(
      fc.property(flightArb(), (f) => {
        const d = delayMinutes(f.scheduledDeparture, f.estimatedDeparture);
        if (f.estimatedDeparture === null) {
          expect(d).toBeNull();
        } else {
          const expected = Math.round(
            (Date.parse(f.estimatedDeparture) - Date.parse(f.scheduledDeparture)) / 60000,
          );
          expect(d).toBe(expected);
        }
      }),
    );
  });

  it("returns null for unparseable timestamps rather than throwing", () => {
    expect(delayMinutes("not-a-date", isoFromOffset(0))).toBeNull();
    expect(delayMinutes(isoFromOffset(0), "not-a-date")).toBeNull();
  });
});

describe("P4: disruption superset (delayed|cancelled|diverted => disrupted)", () => {
  it("holds for all flights regardless of incident links", () => {
    fc.assert(
      fc.property(flightArb(), fc.array(fc.string({ minLength: 1, maxLength: 5 })), (f, activeIds) => {
        const active = new Set(activeIds);
        if (f.status === "DELAYED" || f.status === "CANCELLED" || f.status === "DIVERTED") {
          expect(isDisrupted(f, active)).toBe(true);
        }
      }),
    );
  });
});

describe("P5: SEVERITY_RANK is a strict total order CRITICAL>HIGH>MEDIUM>LOW", () => {
  it("ranks strictly increasing across the four levels", () => {
    expect(SEVERITY_RANK.CRITICAL).toBeGreaterThan(SEVERITY_RANK.HIGH);
    expect(SEVERITY_RANK.HIGH).toBeGreaterThan(SEVERITY_RANK.MEDIUM);
    expect(SEVERITY_RANK.MEDIUM).toBeGreaterThan(SEVERITY_RANK.LOW);
  });

  it("is antisymmetric/consistent for any pair", () => {
    fc.assert(
      fc.property(severityArb, severityArb, (a, b) => {
        if (a === b) expect(SEVERITY_RANK[a]).toBe(SEVERITY_RANK[b]);
        else expect(SEVERITY_RANK[a] === SEVERITY_RANK[b]).toBe(false);
      }),
    );
  });
});

describe("P6/P7: disrupted-flight ordering is deterministic, idempotent, permutation-invariant", () => {
  it("produces identical output when reordered from a permuted input", () => {
    fc.assert(
      fc.property(fc.array(vmArb(), { maxLength: 30 }), (vms) => {
        // Ensure unique ids so the id tiebreaker yields a single canonical order.
        const unique = vms.map((vm, i) => ({
          ...vm,
          flight: { ...vm.flight, id: `${vm.flight.id}-${i}` },
        }));
        const sorted = sortDisruptedFlights(unique);
        const ids = sorted.map((v) => v.flight.id);

        // Idempotent: sorting an already-sorted list is a no-op.
        expect(sortDisruptedFlights(sorted).map((v) => v.flight.id)).toEqual(ids);

        // Permutation-invariant: shuffle then sort -> same order.
        const shuffled = [...unique].reverse();
        expect(sortDisruptedFlights(shuffled).map((v) => v.flight.id)).toEqual(ids);
      }),
    );
  });

  it("orders incidents deterministically and idempotently", () => {
    fc.assert(
      fc.property(fc.array(incidentArb(), { maxLength: 30 }), (incs) => {
        const unique = incs.map((i, idx) => ({ ...i, id: `${i.id}-${idx}` }));
        const sorted = sortIncidents(unique);
        const ids = sorted.map((i) => i.id);
        expect(sortIncidents(sorted).map((i) => i.id)).toEqual(ids);
        expect(sortIncidents([...unique].reverse()).map((i) => i.id)).toEqual(ids);
      }),
    );
  });
});

describe("P8: predicates and sorts do not mutate their inputs", () => {
  it("leaves flights, incident sets, and arrays unchanged", () => {
    fc.assert(
      fc.property(
        fc.array(flightArb(), { maxLength: 10 }),
        fc.array(incidentArb(), { maxLength: 10 }),
        (flights, incidents) => {
          const flightsBefore = snapshot(flights);
          const incidentsBefore = snapshot(incidents);
          const active = activeIncidentIdSet(incidents);

          for (const f of flights) {
            isActive(f);
            isDelayed(f);
            isDisrupted(f, active);
          }

          expect(snapshot(flights)).toEqual(flightsBefore);
          expect(snapshot(incidents)).toEqual(incidentsBefore);
        },
      ),
    );
  });

  it("sortDisruptedFlights returns a new array without mutating input order", () => {
    fc.assert(
      fc.property(fc.array(vmArb(), { maxLength: 20 }), (vms) => {
        const unique = vms.map((vm, i) => ({
          ...vm,
          flight: { ...vm.flight, id: `${vm.flight.id}-${i}` },
        }));
        const before = unique.map((v) => v.flight.id);
        const sorted = sortDisruptedFlights(unique);
        expect(unique.map((v) => v.flight.id)).toEqual(before); // input untouched
        expect(sorted).not.toBe(unique); // new array
      }),
    );
  });
});
