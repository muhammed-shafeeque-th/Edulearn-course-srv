import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Injectable()
export class CheckEnrollmentUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    enrollmentId: string,
    userId: string,
  ): Promise<{ enrolled: boolean }> {
    return await this._tracer.startActiveSpan(
      "CheckEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": enrollmentId,
        });
         this._logger.log(`Fetching enrollments by id ${enrollmentId}`, {
          ctx: CheckEnrollmentUseCase.name,
        });

        const enrollment = await this._enrollmentRepository.findByIdAndUser(
          enrollmentId,
          userId,
        );

         this._logger.log(`Enrollments by id ${enrollmentId} fetched`, {
          ctx: CheckEnrollmentUseCase.name,
        });
        return { enrolled: !!enrollment };
      },
    );
  }
}
