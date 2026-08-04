import { Injectable } from "@nestjs/common";
import {
  IEnrollmentRepository,
  InstructorCoursesEnrollmentSummery,
} from "src/domain/repositories/enrollment.repository";
import { GetInstructorCoursesEnrollmentSummeryRequest } from "src/infrastructure/grpc/generated/course/types/stats";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetInstructorCoursesEnrollmentSummeryUseCase } from "../interfaces/get-courses-enrollment-summery.interface";

@Injectable()
export class GetInstructorCoursesEnrollmentSummeryUseCase implements IGetInstructorCoursesEnrollmentSummeryUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    data: GetInstructorCoursesEnrollmentSummeryRequest,
  ): Promise<InstructorCoursesEnrollmentSummery | null> {
    return this._tracer.startActiveSpan(
      "GetInstructorCoursesEnrollmentSummeryUseCase.execute",
      async (span) => {
        span.setAttributes({
          "instructor.id": data.instructorId,
        });

        this._logger.log(
          `Fetching courses enrollment summary for instructor ${data.instructorId}`,
          { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name },
        );

        const summary =
          await this._enrollmentRepository.getInstructorCoursesEnrollmentSummery(
            data.instructorId,
          );
        console.log(
          "Instructor enrollment Summery : " + JSON.stringify(summary, null, 2),
        );

        if (!summary) {
          span.setAttribute("summary.found", false);
          this._logger.warn(
            `No enrollment summary found for instructor ${data.instructorId}`,
            { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name },
          );
          return null;
        }

        span.setAttribute("summary.found", true);
        span.setAttribute("summary.totalStudents", summary.totalStudents);
        span.setAttribute("summary.totalEarnings", summary.totalEarnings);
        span.setAttribute("summary.avgCompletion", summary.avgCompletion);
        span.setAttribute("summary.activeStudents", summary.activeStudents);

        this._logger.log(
          `Successfully fetched enrollment summary for instructor ${data.instructorId}`,
          { ctx: GetInstructorCoursesEnrollmentSummeryUseCase.name },
        );

        return summary;
      },
    );
  }
}
