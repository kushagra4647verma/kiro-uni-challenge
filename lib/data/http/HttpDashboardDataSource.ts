import type { DashboardDataSource } from "@/lib/data/DashboardDataSource";
import type { DashboardSnapshot } from "@/lib/domain/types";

/**
 * Future adapter for the FastAPI + MongoDB backend. Documented but inert in
 * this iteration — the backend is not built yet (Requirement 6.4).
 *
 * When the backend arrives, this class becomes live with NO changes to any UI
 * component: the JSON returned by `GET /api/dashboard/snapshot` matches the
 * shared DashboardSnapshot model, so only getDataSource() needs to select it.
 */
export class HttpDashboardDataSource implements DashboardDataSource {
  constructor(private readonly baseUrl: string) {}

  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    // Intentionally not implemented in this iteration.
    // Reference implementation for when the backend exists:
    //
    //   const res = await fetch(`${this.baseUrl}/api/dashboard/snapshot`, {
    //     cache: "no-store",
    //   });
    //   if (!res.ok) throw new Error(`Snapshot request failed: ${res.status}`);
    //   return (await res.json()) as DashboardSnapshot;
    throw new Error(
      `HttpDashboardDataSource is not implemented yet (baseUrl=${this.baseUrl}). ` +
        "Set NEXT_PUBLIC_DATA_SOURCE=mock until the FastAPI backend is available.",
    );
  }
}
