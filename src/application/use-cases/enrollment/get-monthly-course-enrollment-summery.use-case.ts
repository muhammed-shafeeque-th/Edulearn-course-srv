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
          { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name }
        );

        try {
          // This should return an array of MonthlyCoursesEnrollment
          const stats: MonthlyCoursesEnrollment[] | null = await this.enrollmentRepository.getMonthlyCourseEnrollmentStats(
            data.year
          );

          if (!stats || stats.length === 0) {
            span.setAttribute("stats.found", false);
            this.logger.warn(
              `No monthly courses enrollment stats found for year ${data.year}`,
              { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name }
            );
            return null;
          }

          span.setAttribute("stats.found", true);
          span.setAttribute("stats.length", stats.length);

          this.logger.log(
            `Successfully fetched ${stats.length} monthly courses enrollment stats for year ${data.year}`,
            { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name }
          );

          // Return as expected by protobuf contract: { stats }
          return { stats };
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Error fetching monthly courses enrollment stats: ${
              error instanceof Error ? error.message : error
            }`,
            { ctx: GetMonthlyCoursesEnrollmentStatsUseCase.name, error }
          );
          throw error;
        }
      }
    );
  }
}
