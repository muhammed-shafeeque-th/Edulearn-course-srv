import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetRevenueStatsRequest,
  RevenueStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to fetch revenue statistics for enrollments by year.
 */
@Injectable()
export class GetRevenueStatsUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Executes the use case to get enrollment revenue stats for a specific year.
   * @param data - The request containing year.
   * @returns The revenue statistics for enrollments in that year.
   */
  async execute(
    data: GetRevenueStatsRequest,
  ): Promise<RevenueStats | null> {
    return this.tracer.startActiveSpan(
      "GetRevenueStatsUseCase.execute",
      async (span) => {
        span.setAttribute("year", data.year);
        this.logger.log(
          `Fetching revenue stats for year ${data.year}`,
          { ctx: GetRevenueStatsUseCase.name }
        );

        try {
          if (!data.year || !/^\d{4}$/.test(data.year)) {
            throw new Error(`Invalid input year: ${data.year}`);
          }

          const stats = await this.enrollmentRepository.getRevenueStatus(
            data.year
          );

          this.logger.log(
            `Successfully fetched revenue stats for year ${data.year}`,
            { ctx: GetRevenueStatsUseCase.name }
          );

          return stats;
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Error fetching revenue stats: ${error instanceof Error ? error.message : error}`,
            { ctx: GetRevenueStatsUseCase.name, error }
          );
          throw error;
        }
      }
    );
  }
}
