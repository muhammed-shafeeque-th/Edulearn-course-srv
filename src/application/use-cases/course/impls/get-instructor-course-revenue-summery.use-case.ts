import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import {
  GetInstructorCourseRevenueSummeryRequest,
  InstructorCourseRevenueSummery,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IGetInstructorCourseRevenueSummeryUseCase } from "../interfaces/get-instructor-course-revenue-summery.interface";

@Injectable()
export class GetInstructorCourseRevenueSummeryUseCase
  implements IGetInstructorCourseRevenueSummeryUseCase
{
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: GetInstructorCourseRevenueSummeryRequest,
  ): Promise<InstructorCourseRevenueSummery> {
    return this._tracer.startActiveSpan(
      "GetInstructorCourseRevenueSummeryUseCase.execute",
      async (span) => {
        try {
           this._logger.debug(
            `[GetInstructorCourseRevenueSummeryUseCase] Fetching revenue summary for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}`,
          );

          const stats =
            await this._enrollmentRepository.getInstructorCourseRevenueSummery(
              dto.instructorId,
              dto.courseId,
            );

          if (!stats) {
             this._logger.warn(
              `[GetInstructorCourseRevenueSummeryUseCase] No revenue summary found for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}`,
            );
            throw new CourseNotFoundException(
              `Course with id ${dto.courseId} for instructor ${dto.instructorId} is not found`,
            );
          }

          // Compose the response as expected by the proto definition
          const response: InstructorCourseRevenueSummery = {
            totalRevenue: stats.totalRevenue,
            avgRevenue: stats.avgRevenue,
            thisMonthRevenue: stats.thisMonthRevenue,
            revenueGrowth: stats.revenueGrowth,
          };

          return response;
        } catch (error: any) {
          span?.setAttribute("error", true);
           this._logger.error(
            `[GetInstructorCourseRevenueSummeryUseCase] Failed to fetch revenue summary for courseId: ${dto.courseId}, instructorId: ${dto.instructorId}. Reason: ${error?.message}`,
            { error },
          );
          throw error;
        }
      },
    );
  }
}
