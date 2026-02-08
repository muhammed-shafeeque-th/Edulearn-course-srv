import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetInstructorCourseEnrollmentSummeryRequest,
  InstructorCourseEnrollmentSummery,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to get a summary of enrollments for a specific course and instructor.
 */
@Injectable()
export class GetInstructorCourseEnrollmentSummeryUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) { }

  /**
   * Executes the use case to get an instructor's enrollment summary for a specific course.
   * @param data - The request containing instructor and course identifiers.
   * @returns The enrollment summary or null if not found.
   */
  async execute(
    data: GetInstructorCourseEnrollmentSummeryRequest,
  ): Promise<InstructorCourseEnrollmentSummery | null> {
    return this.tracer.startActiveSpan(
      "GetInstructorCourseEnrollmentSummeryUseCase.execute",
      async (span) => {
        try {
          // Set relevant trace attributes
          span.setAttribute("instructor.id", data.instructorId);
          span.setAttribute("course.id", data.courseId);

          this.logger.log(
            `Fetching course enrollment summary for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name }
          );

          const summary = await this.enrollmentRepository.getInstructorCourseEnrollmentSummery(
            data.instructorId,
            data.courseId
          );

          if (!summary) {
            span.setAttribute("summary.found", false);
            this.logger.warn(
              `No enrollment summary found for instructor ${data.instructorId} on course ${data.courseId}`,
              { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name }
            );
            return null;
          }

          span.setAttribute("summary.found", true);
          span.setAttribute("summary.totalStudents", summary.totalStudents);
          span.setAttribute("summary.completionRate", summary.completionRate);
          span.setAttribute("summary.avgProgress", summary.avgProgress);

          this.logger.log(
            `Successfully fetched enrollment summary for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name }
          );

          return summary;
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Error fetching enrollment summary: ${error instanceof Error ? error.message : error}`,
            { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name, error }
          );
          throw error;
        }
      }
    );
  }
}
