import type { DashboardDataSource } from "./DashboardDataSource";
import { MockDashboardDataSource } from "./mock/MockDashboardDataSource";
import { HttpDashboardDataSource } from "./http/HttpDashboardDataSource";

/**
 * The single configuration point that selects the active data source
 * (Requirement 6.3). Swapping to the FastAPI backend later is a change here
 * only — UI components never reference a concrete implementation.
 *
 * Controlled by NEXT_PUBLIC_DATA_SOURCE ("mock" | "http"), defaulting to mock.
 */
export function getDataSource(): DashboardDataSource {
  const kind = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

  switch (kind) {
    case "http":
      return new HttpDashboardDataSource(process.env.API_BASE_URL ?? "");
    case "mock":
    default:
      return new MockDashboardDataSource();
  }
}
