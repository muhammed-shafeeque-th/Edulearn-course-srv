import { Injectable } from "@nestjs/common";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Injectable()
export class DeleteEnrollmentUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(enrollmentId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

         this._logger.log(`Deleting enrollment ${enrollmentId}`, {
          ctx: DeleteEnrollmentUseCase.name,
        });

        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          throw new EnrollmentNotFoundException(
            `Enrollment ${enrollmentId} not found`,
          );
        }

        await this._enrollmentRepository.remove(enrollment);

         this._logger.log(`Enrollment ${enrollmentId} deleted`, {
          ctx: DeleteEnrollmentUseCase.name,
        });
      },
    );
  }
}
