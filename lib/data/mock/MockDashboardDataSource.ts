import type { DashboardDataSource } from "@/lib/data/DashboardDataSource";
import type { DashboardSnapshot } from "@/lib/domain/types";
import { buildMockSnapshot } from "./mockData";

/**
 * In-memory implementation of DashboardDataSource backed by realistic mock
 * aviation data. Async to match the interface the future HTTP adapter will use.
 */
export class MockDashboardDataSource implements DashboardDataSource {
  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    return buildMockSnapshot();
  }
}
