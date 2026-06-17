import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetMonthlyCoursesEnrollmentStatsRequest,
  MonthlyCoursesEnrollmentStats,
  MonthlyCoursesEnrollment,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to fetch monthly enrollment statistics for all courses for a given year.
 */
@Injectable()
export class GetMonthlyCoursesEnrollmentStatsUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Executes the use case to get monthly enrollment stats for all courses for a given year.
   * @param data - The request containing the target year.
   * @returns The monthly courses enrollment stats, or null if not found.
   */
  async execute(
    data: GetMonthlyCoursesEnrollmentStatsRequest,
  ): Promise<MonthlyCoursesEnrollmentStats | null> {
    return this.tracer.startActiveSpan(
      "GetMonthlyCoursesEnrollmentStatsUseCase.execute",
      async (span) => {
        span.setAttribute("year", data.year);

        this.logger.log(
          `Fetching monthly courses enrollment stats for year ${data.year}`,
          { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name },
        );

        try {
          // This should return an array of MonthlyCoursesEnrollment
          const trend: MonthlyCoursesEnrollment[] | null =
            await this.enrollmentRepository.getMonthlyCourseEnrollmentStats(
              data.year,
            );

          if (!trend || trend.length === 0) {
            span.setAttribute("trend.found", false);
            this.logger.warn(
              `No monthly courses enrollment trend found for year ${data.year}`,
              { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name },
            );
            return null;
          }

          span.setAttribute("trend.found", true);
          span.setAttribute("trend.length", trend.length);

          this.logger.log(
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
          this.logger.error(
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
