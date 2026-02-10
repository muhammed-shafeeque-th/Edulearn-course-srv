import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository, InstructorCoursesEnrollmentSummery } from "src/domain/repositories/enrollment.repository";
import { GetInstructorCoursesEnrollmentSummeryRequest } from "src/infrastructure/grpc/generated/course/types/stats";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

/**
 * Use case to get a summary of enrollments across all courses for an instructor.
 */
@Injectable()
export class GetInstructorCoursesEnrollmentSummeryUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    data: GetInstructorCoursesEnrollmentSummeryRequest,
  ): Promise<InstructorCoursesEnrollmentSummery | null> {
    return this.tracer.startActiveSpan(
      "GetInstructorCoursesEnrollmentSummeryUseCase.execute",
      async (span) => {
        span.setAttributes({
          "instructor.id": data.instructorId,
        });

        this.logger.log(
          `Fetching courses enrollment summary for instructor ${data.instructorId}`,
          { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name }
        );

        const summary = await this.enrollmentRepository.getInstructorCoursesEnrollmentSummery(
          data.instructorId
        );

        if (!summary) {
          span.setAttribute("summary.found", false);
          this.logger.warn(
            `No enrollment summary found for instructor ${data.instructorId}`,
            { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name }
          );
          return null;
        }

        span.setAttribute("summary.found", true);
        span.setAttribute("summary.totalStudents", summary.totalStudents);
        span.setAttribute("summary.totalEarnings", summary.totalEarnings);
        span.setAttribute("summary.avgCompletion", summary.avgCompletion);
        span.setAttribute("summary.activeStudents", summary.activeStudents);

        this.logger.log(
          `Successfully fetched enrollment summary for instructor ${data.instructorId}`,
          { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name }
        );

        return summary;
      }
    );
  }
}
