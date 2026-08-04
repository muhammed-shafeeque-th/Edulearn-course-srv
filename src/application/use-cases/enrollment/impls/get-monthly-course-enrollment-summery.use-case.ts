import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetMonthlyCoursesEnrollmentStatsRequest,
  MonthlyCoursesEnrollmentStats,
  MonthlyCoursesEnrollment,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetMonthlyCoursesEnrollmentStatsUseCase } from "../interfaces/get-monthly-course-enrollment-summery.interface";

@Injectable()
export class GetMonthlyCoursesEnrollmentStatsUseCase implements IGetMonthlyCoursesEnrollmentStatsUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    data: GetMonthlyCoursesEnrollmentStatsRequest,
  ): Promise<MonthlyCoursesEnrollmentStats | null> {
    return this._tracer.startActiveSpan(
      "GetMonthlyCoursesEnrollmentStatsUseCase.execute",
      async (span) => {
        span.setAttribute("year", data.year);

        this._logger.log(
          `Fetching monthly courses enrollment stats for year ${data.year}`,
          { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name },
        );

        try {
          // This should return an array of MonthlyCoursesEnrollment
          const trend: MonthlyCoursesEnrollment[] | null =
            await this._enrollmentRepository.getMonthlyCourseEnrollmentStats(
              data.year,
            );

          if (!trend || trend.length === 0) {
            span.setAttribute("trend.found", false);
            this._logger.warn(
              `No monthly courses enrollment trend found for year ${data.year}`,
              { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name },
            );
            return null;
          }

          span.setAttribute("trend.found", true);
          span.setAttribute("trend.length", trend.length);

          this._logger.log(
            `Successfully fetched ${trend.length} monthly courses enrollment trend for year ${data.year}`,
            { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name },
          );

          // Return as expected by protobuf contract: { trend }
          return {
            trend: trend.map((trend) => ({
              month: trend.month,
              enrollments: trend.count,
            })),
          };
        } catch (error) {
          span.setAttribute("error", true);
          this._logger.error(
            `Error fetching monthly courses enrollment stats: ${
              error instanceof Error ? error.message : error
            }`,
            { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name, error },
          );
          throw error;
        }
      },
    );
  }
}
