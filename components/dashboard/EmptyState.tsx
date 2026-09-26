/**
 * Explicit empty-state message for a section, so an empty region is never
 * mistaken for missing UI (Requirements 2.7, 3.6, 7.4).
 */
export function EmptyState({
  section,
  message,
}: {
  section: string;
  message: string;
}) {
  return (
    <div
      data-testid={`empty-${section}`}
      className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-sm text-slate-400"
    >
      {message}
    </div>
  );
}
