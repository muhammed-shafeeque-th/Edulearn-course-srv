import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetInstructorCourseEnrollmentSummeryRequest,
  InstructorCourseEnrollmentSummery,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetInstructorCourseEnrollmentSummeryUseCase } from "../interfaces/get-course-enrollment-summery.interface";

@Injectable()
export class GetInstructorCourseEnrollmentSummeryUseCase implements IGetInstructorCourseEnrollmentSummeryUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    data: GetInstructorCourseEnrollmentSummeryRequest,
  ): Promise<InstructorCourseEnrollmentSummery | null> {
    return this._tracer.startActiveSpan(
      "GetInstructorCourseEnrollmentSummeryUseCase.execute",
      async (span) => {
          // Set relevant trace attributes
          span.setAttribute("instructor.id", data.instructorId);
          span.setAttribute("course.id", data.courseId);

          this._logger.debug(
            `Fetching course enrollment summary for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name },
          );

          const summary =
            await this._enrollmentRepository.getInstructorCourseEnrollmentSummery(
              data.instructorId,
              data.courseId,
            );

          if (!summary) {
            span.setAttribute("summary.found", false);
            this._logger.warn(
              `No enrollment summary found for instructor ${data.instructorId} on course ${data.courseId}`,
              { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name },
            );
            return null;
          }

          span.setAttribute("summary.found", true);
          span.setAttribute("summary.totalStudents", summary.totalStudents);
          span.setAttribute("summary.completionRate", summary.completionRate);
          span.setAttribute("summary.avgProgress", summary.avgProgress);

          this._logger.debug(
            `Successfully fetched enrollment summary for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentSummeryUseCase.name },
          );

          return summary;
      },
    );
  }
}
