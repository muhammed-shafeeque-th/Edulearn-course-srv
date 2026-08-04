import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import {
  GetInstructorCourseEnrollmentTrendRequest,
  InstructorCourseEnrollmentTrend,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetInstructorCourseEnrollmentTrendUseCase } from "../interfaces/get-course-enrollment-trend.interface";

@Injectable()
export class GetInstructorCourseEnrollmentTrendUseCase implements IGetInstructorCourseEnrollmentTrendUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    data: GetInstructorCourseEnrollmentTrendRequest,
  ): Promise<InstructorCourseEnrollmentTrend | null> {
    return this._tracer.startActiveSpan(
      "GetInstructorCourseEnrollmentTrendUseCase.execute",
      async (span) => {
        span.setAttribute("instructor.id", data.instructorId);
        span.setAttribute("course.id", data.courseId);
        this._logger.log(
          `Fetching course enrollment trend for instructor ${data.instructorId}, course ${data.courseId}`,
          { ctx: GetInstructorCourseEnrollmentTrendUseCase.name },
        );

        try {
          const trend =
            await this._enrollmentRepository.getInstructorCourseEnrollmentTrend(
              data.instructorId,
              data.courseId,
              data.from,
              data.to,
            );

          if (!trend) {
            span.setAttribute("trend.found", false);
            this._logger.warn(
              `No enrollment trend found for instructor ${data.instructorId} on course ${data.courseId}`,
              { ctx: GetInstructorCourseEnrollmentTrendUseCase.name },
            );
            return null;
          }

          span.setAttribute("trend.found", true);
          span.setAttribute(
            "trend.length",
            Array.isArray(trend.trend) ? trend.trend.length : 0,
          );

          this._logger.log(
            `Successfully fetched enrollment trend for instructor ${data.instructorId}, course ${data.courseId}`,
            { ctx: GetInstructorCourseEnrollmentTrendUseCase.name },
          );

          return trend;
        } catch (error) {
          span.setAttribute("error", true);
          this._logger.error(
            `Error fetching enrollment trend: ${error instanceof Error ? error.message : error}`,
            { ctx: GetInstructorCourseEnrollmentTrendUseCase.name, error },
          );
          throw error;
        }
      },
    );
  }
}
