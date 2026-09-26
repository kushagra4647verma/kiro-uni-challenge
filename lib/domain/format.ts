/**
 * Pure formatting utilities. Framework-free and deterministic so they can be
 * unit-tested directly (Requirement 8.2).
 */

/**
 * Delay in whole minutes between scheduled and estimated departure.
 * Returns null when the delay is not computable (missing estimated departure).
 */
export function delayMinutes(
  scheduled: string,
  estimated: string | null,
): number | null {
  if (!estimated) return null;
  const schedMs = Date.parse(scheduled);
  const estMs = Date.parse(estimated);
  if (Number.isNaN(schedMs) || Number.isNaN(estMs)) return null;
  return Math.round((estMs - schedMs) / 60000);
}

/**
 * Human-readable delay label.
 *  75   -> "1h 20m"
 *  45   -> "45m"
 *  0    -> "0m"
 *  null -> "N/A"
 * Negative values (early) are clamped to "0m" for display purposes.
 */
export function formatDelay(minutes: number | null): string {
  if (minutes === null) return "N/A";
  const m = Math.max(0, minutes);
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Machine-readable ISO timestamp for markup (e.g. <time dateTime>). */
export function toIsoAttr(iso: string): string {
  return iso;
}

/**
 * Locale-aware date-time for display. Falls back to the raw string if the
 * timestamp cannot be parsed, so bad data never throws in the UI.
 */
export function formatDateTime(iso: string, locale?: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleString(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
