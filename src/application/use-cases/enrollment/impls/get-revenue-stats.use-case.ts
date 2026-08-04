import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetRevenueStatsRequest,
  RevenueStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetRevenueStatsUseCase } from "../interfaces/get-revenue-stats.interface";

/**
 * Use case to fetch revenue statistics for enrollments by year.
 */
@Injectable()
export class GetRevenueStatsUseCase implements IGetRevenueStatsUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  /**
   * Executes the use case to get enrollment revenue stats for a specific year.
   * @param data - The request containing year.
   * @returns The revenue statistics for enrollments in that year.
   */
  async execute(data: GetRevenueStatsRequest): Promise<RevenueStats | null> {
    return this._tracer.startActiveSpan(
      "GetRevenueStatsUseCase.execute",
      async (span) => {
        span.setAttribute("year", data.year);
        this._logger.log(`Fetching revenue stats for year ${data.year}`, {
          ctx: GetRevenueStatsUseCase.name,
        });

        try {
          if (!data.year || !/^\d{4}$/.test(data.year)) {
            throw new Error(`Invalid input year: ${data.year}`);
          }

          const stats = await this._enrollmentRepository.getRevenueStatus(
            data.year,
          );

          this._logger.log(
            `Successfully fetched revenue stats for year ${data.year}`,
            { ctx: GetRevenueStatsUseCase.name },
          );

          return stats;
        } catch (error) {
          span.setAttribute("error", true);
          this._logger.error(
            `Error fetching revenue stats: ${error instanceof Error ? error.message : error}`,
            { ctx: GetRevenueStatsUseCase.name, error },
          );
          throw error;
        }
      },
    );
  }
}
