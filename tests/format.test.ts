import { describe, it, expect } from "vitest";
import { delayMinutes, formatDelay, formatDateTime } from "@/lib/domain/format";

describe("delayMinutes", () => {
  it("computes whole-minute delay between scheduled and estimated", () => {
    expect(
      delayMinutes("2026-01-01T10:00:00Z", "2026-01-01T11:15:00Z"),
    ).toBe(75);
  });

  it("returns 0 for on-time flights", () => {
    expect(
      delayMinutes("2026-01-01T10:00:00Z", "2026-01-01T10:00:00Z"),
    ).toBe(0);
  });

  it("returns negative minutes for early estimated departure", () => {
    expect(
      delayMinutes("2026-01-01T10:00:00Z", "2026-01-01T09:50:00Z"),
    ).toBe(-10);
  });

  it("returns null when estimated departure is missing", () => {
    expect(delayMinutes("2026-01-01T10:00:00Z", null)).toBeNull();
  });

  it("returns null when a timestamp is unparseable", () => {
    expect(delayMinutes("not-a-date", "2026-01-01T10:00:00Z")).toBeNull();
  });
});

describe("formatDelay", () => {
  it("formats hours and minutes", () => {
    expect(formatDelay(75)).toBe("1h 15m");
    expect(formatDelay(80)).toBe("1h 20m");
  });

  it("formats minutes only when under an hour", () => {
    expect(formatDelay(45)).toBe("45m");
  });

  it("formats zero as 0m", () => {
    expect(formatDelay(0)).toBe("0m");
  });

  it("clamps negative (early) values to 0m", () => {
    expect(formatDelay(-10)).toBe("0m");
  });

  it("returns N/A for null", () => {
    expect(formatDelay(null)).toBe("N/A");
  });

  it("formats exact hour boundaries", () => {
    expect(formatDelay(120)).toBe("2h 0m");
  });
});

describe("formatDateTime", () => {
  it("returns the raw string for unparseable input rather than throwing", () => {
    expect(formatDateTime("garbage")).toBe("garbage");
  });

  it("produces a non-empty string for a valid ISO timestamp", () => {
    expect(formatDateTime("2026-01-01T10:00:00Z", "en-US").length).toBeGreaterThan(0);
  });
});
