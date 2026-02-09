import { Injectable } from "@nestjs/common";
import { EnrollmentNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class DeleteEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(enrollmentId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

        this.logger.log(`Deleting enrollment ${enrollmentId}`, {
          ctx: DeleteEnrollmentUseCase.name,
        });

        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          throw new EnrollmentNotFoundException(`Enrollment ${enrollmentId} not found`);
        }

        await this.enrollmentRepository.remove(enrollment);

        this.logger.log(`Enrollment ${enrollmentId} deleted`, {
          ctx: DeleteEnrollmentUseCase.name,
        });
      },
    );
  }
}
