import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetEnrollmentTrendRequest,
  EnrollmentTrendStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetEnrollmentTrendUseCase } from "../interfaces/get-enrollment-trend.interface";

@Injectable()
export class GetEnrollmentTrendUseCase implements IGetEnrollmentTrendUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  /**
   * Executes the use case to get enrollment trend for a specific year.
   * @param data - The request containing the year.
   * @returns The enrollment trend stats or null if not found.
   */
  async execute(
    data: GetEnrollmentTrendRequest,
  ): Promise<EnrollmentTrendStats | null> {
    return this._tracer.startActiveSpan(
      "GetEnrollmentTrendUseCase.execute",
      async (span) => {
        span.setAttribute("year", data.year);
         this._logger.log(
          `Fetching course enrollment trend for year ${data.year}`,
          { ctx: GetEnrollmentTrendUseCase.name },
        );

        try {
          const trend = await this._enrollmentRepository.getEnrollmentTrend(
            data.year,
          );

          if (!trend) {
            span.setAttribute("trend.found", false);
             this._logger.warn(
              `No enrollment trend found for year ${data.year}`,
              { ctx: GetEnrollmentTrendUseCase.name },
            );
            return null;
          }

          span.setAttribute("trend.found", true);

           this._logger.log(
            `Successfully fetched enrollment trend for year ${data.year}`,
            { ctx: GetEnrollmentTrendUseCase.name },
          );

          return trend;
        } catch (error) {
          span.setAttribute("error", true);
           this._logger.error(
            `Error fetching enrollment trend: ${error instanceof Error ? error.message : error}`,
            { ctx: GetEnrollmentTrendUseCase.name, error },
          );
          throw error;
        }
      },
    );
  }
}
