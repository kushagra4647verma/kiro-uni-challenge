import type { DashboardSnapshot } from "@/lib/domain/types";

/**
 * The single abstraction the dashboard reads through. UI and view-model code
 * depend only on this interface — never on a concrete implementation — so the
 * in-memory mock can later be swapped for an HTTP adapter (FastAPI + MongoDB)
 * with no UI changes (Requirement 6).
 */
export interface DashboardDataSource {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
}
