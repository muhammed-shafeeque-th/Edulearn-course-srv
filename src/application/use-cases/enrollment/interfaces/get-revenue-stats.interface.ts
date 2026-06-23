import {
  GetRevenueStatsRequest,
  RevenueStats,
} from "src/infrastructure/grpc/generated/course/types/stats";

/**
 * Use case to fetch revenue statistics for enrollments by year.
 */
export abstract class IGetRevenueStatsUseCase {
  /**
   * Executes the use case to get enrollment revenue stats for a specific year.
   * @param data - The request containing year.
   * @returns The revenue statistics for enrollments in that year.
   */
  abstract execute(data: GetRevenueStatsRequest): Promise<RevenueStats | null>;
}
