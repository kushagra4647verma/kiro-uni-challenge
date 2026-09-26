/**
 * Suspense loading UI (Requirement 7.1). Shown while the server component
 * awaits the dashboard snapshot. No metric values are rendered during load —
 * only skeleton placeholders — so a loading dashboard is never mistaken for
 * real operational data.
 */
export default function Loading() {
  return (
    <main
      data-testid="dashboard-loading"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mb-6 h-8 w-72 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/70" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </div>
      </div>
    </main>
  );
}
