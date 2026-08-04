import { Injectable } from "@nestjs/common";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ICheckCourseEnrollmentUseCase } from "../interfaces/check-course-enrollment.interface";

@Injectable()
export class CheckCourseEnrollmentUseCase implements ICheckCourseEnrollmentUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    courseId: string,
    userId: string,
  ): Promise<{ enrolled: boolean }> {
    return this._tracer.startActiveSpan(
      "CheckCourseEnrollmentUseCase.execute",
      async (span) => {
        try {
          span.setAttribute("course.id", courseId);

          this._logger.log(
            `Checking enrollment for user ${userId} in course ${courseId}`,
            { ctx: CheckCourseEnrollmentUseCase.name },
          );

          // Ensure course exists before checking enrollment
          const course = await this._courseRepository.findById(courseId);

          if (!course) {
            this._logger.warn(`Course not found: ${courseId}`, {
              ctx: CheckCourseEnrollmentUseCase.name,
            });
            throw new CourseNotFoundException(
              `Course not found with given Id ${courseId}`,
            );
          }

          const enrollment =
            await this._enrollmentRepository.findByUserAndCourse(
              userId,
              courseId,
            );

          this._logger.log(
            `Enrollment check for user ${userId} in course ${courseId} completed`,
            { ctx: CheckCourseEnrollmentUseCase.name },
          );

          return { enrolled: Boolean(enrollment) };
        } catch (error: any) {
          this._logger.error(
            `Error checking enrollment for user ${userId} in course ${courseId}: ${error?.message || error}`,
            {
              ctx: CheckCourseEnrollmentUseCase.name,
              error,
            },
          );
          throw error;
        }
      },
    );
  }
}
