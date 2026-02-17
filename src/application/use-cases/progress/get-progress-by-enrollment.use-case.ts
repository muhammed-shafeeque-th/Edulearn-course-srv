import { Injectable } from "@nestjs/common";
import { statSync } from "fs";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetProgressesByEnrollmentUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(enrollmentId: string): Promise<ProgressDto[]> {
    return await this.tracer.startActiveSpan(
      "GetProgressesByEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

        this.logger.log(`Fetching progress by enrollment ${enrollmentId}`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });

        const progresses =
          await this.progressRepository.findByEnrollmentId(enrollmentId);

        this.logger.log(`Progresses of enrolment ${enrollmentId} fetched`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });
        return progresses.map(ProgressDto.fromDomain);
      },
    );
  }
}
