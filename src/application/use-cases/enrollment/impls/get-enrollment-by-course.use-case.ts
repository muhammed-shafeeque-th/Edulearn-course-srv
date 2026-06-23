import { Injectable } from "@nestjs/common";
import { EnrollmentDto } from "src/application/dtos/enrollment.dto";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetEnrollmentsByCourseUseCase } from "../interfaces/get-enrollment-by-course.interface";

@Injectable()
export class GetEnrollmentsByCourseUseCase
  implements IGetEnrollmentsByCourseUseCase
{
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(courseId: string): Promise<EnrollmentDto[]> {
    return await this._tracer.startActiveSpan(
      "GetEnrollmentsByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
         this._logger.log(`Fetching enrollments by course ${courseId}`, {
          ctx: GetEnrollmentsByCourseUseCase.name,
        });

        const enrollments =
          await this._enrollmentRepository.listEnrollmentsByCourse(courseId);

        span.setAttribute("course.enrollment.count", enrollments.length);

         this._logger.log(`Enrollments by course ${courseId} fetched`, {
          ctx: GetEnrollmentsByCourseUseCase.name,
        });
        return enrollments.map(EnrollmentDto.fromDomain);
      },
    );
  }
}
