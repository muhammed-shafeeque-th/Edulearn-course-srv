import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetInstructorCourseEnrollmentTrendRequest,
  InstructorCourseEnrollmentTrend,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to fetch enrollment trend for a specific course and instructor.
 */
@Injectable()
export class GetInstructorCourseEnrollmentTrendUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Executes the use case to get an instructor's enrollment trend for a specific course.
   * @param data - The request containing instructor and course identifiers.
   * @returns The enrollment trend or null if not found.
   */
  async execute(
    data: GetInstructorCourseEnrollmentTrendRequest,
  ): Promise<InstructorCourseEnrollmentTrend | null> {
    return this.tracer.startActiveSpan(
      "GetInstructorCourseEnrollmentTrendUseCase.execute",
      async (span) => {
        span.setAttribute("instructor.id", data.instructorId);
        span.setAttribute("course.id", data.courseId);
        this.logger.log(
          `Fetching course enrollment trend for instructor ${data.instructorId}, course ${data.courseId}`,
          { ctx: GetInstructorCourseEnrollmentTrendUseCase.name }
        );

        try {
          const trend = await this.enrollmentRepository.getInstructorCourseEnrollmentTrend(
            data.instructorId,
            data.courseId,
            data.from,
            data.to
          );

          if (!trend) {
            span.setAttribute("trend.found", false);
            this.logger.warn(
              `No enrollment trend found for instructor ${data.instructorId} on course ${data.courseId}`,
              { ctx: GetInstructorCourseEnrollmentTrendUseCase.name }
            );
            return null;
          }

          span.setAttribute("trend.found", true);
          span.setAttribute("trend.length", Array.isArray(trend.trend) ? trend.trend.length : 0);

          this.logger.log(
            `Successfully fetched enrollment trend for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentTrendUseCase.name }
          );

          return trend;
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Error fetching enrollment trend: ${error instanceof Error ? error.message : error}`,
            { ctx: GetInstructorCourseEnrollmentTrendUseCase.name, error }
          );
          throw error;
        }
      }
    );
  }
}
