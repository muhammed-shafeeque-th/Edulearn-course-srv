import { Injectable } from "@nestjs/common";
import { CourseNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class CheckCourseEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    courseId: string,
    userId: string
  ): Promise<{ enrolled: boolean }> {
    return this.tracer.startActiveSpan(
      "CheckCourseEnrollmentUseCase.execute",
      async (span) => {
        try {
          span.setAttribute("course.id", courseId);

          this.logger.log(
            `Checking enrollment for user ${userId} in course ${courseId}`,
            { ctx: CheckCourseEnrollmentUseCase.name }
          );

          // Ensure course exists before checking enrollment
          const course = await this.courseRepository.findById(courseId);

          if (!course) {
            this.logger.warn(`Course not found: ${courseId}`, {
              ctx: CheckCourseEnrollmentUseCase.name,
            });
            throw new CourseNotFoundException(
              `Course not found with given Id ${courseId}`
            );
          }

          const enrollment =
            await this.enrollmentRepository.getByUserAndCourse(
              userId,
              courseId
            );

          this.logger.log(
            `Enrollment check for user ${userId} in course ${courseId} completed`,
            { ctx: CheckCourseEnrollmentUseCase.name }
          );

          return { enrolled: Boolean(enrollment) };
        } catch (error) {
          this.logger.error(
            `Error checking enrollment for user ${userId} in course ${courseId}: ${error?.message || error}`,
            {
              ctx: CheckCourseEnrollmentUseCase.name,
              error,
            }
          );
          throw error;
        }
      }
    );
  }
}
