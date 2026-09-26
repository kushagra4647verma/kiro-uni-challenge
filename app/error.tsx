"use client";

/**
 * Error boundary for the dashboard (Requirements 7.2, 7.3). If the data
 * request fails, the user sees a clear message that operational data could not
 * be loaded plus a Retry affordance. Retry calls reset(), which re-runs the
 * server component's data fetch; on success the error state is replaced by the
 * loaded dashboard.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      data-testid="dashboard-error"
      className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center"
    >
      <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-8">
        <h1 className="text-xl font-semibold text-slate-50">
          Couldn&apos;t load operational data
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          The dashboard data source did not respond. This does not reflect live
          operations — please retry.
        </p>
        {error.message ? (
          <p className="mt-3 rounded bg-slate-900/60 px-3 py-2 text-xs text-slate-500">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
