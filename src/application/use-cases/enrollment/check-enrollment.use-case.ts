import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class CheckEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    enrollmentId: string,
    userId: string
  ): Promise<{ enrolled: boolean }> {
    return await this.tracer.startActiveSpan(
      "CheckEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": enrollmentId,
        });
        this.logger.log(`Fetching enrollments by id ${enrollmentId}`, {
          ctx: CheckEnrollmentUseCase.name,
        });

        const enrollment = await this.enrollmentRepository.getByIdAndUser(
          enrollmentId,
          userId
        );

        this.logger.log(`Enrollments by id ${enrollmentId} fetched`, {
          ctx: CheckEnrollmentUseCase.name,
        });
        return { enrolled: !!enrollment };
      }
    );
  }
}
