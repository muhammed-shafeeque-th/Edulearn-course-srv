import { Injectable } from "@nestjs/common";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { ProgressNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(progressId: string): Promise<ProgressDto> {
    return await this.tracer.startActiveSpan(
      "GetProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "progress.id": progressId,
        });

        this.logger.log(`Fetching progress ${progressId}`, {
          ctx: GetProgressUseCase.name,
        });

        const progress = await this.progressRepository.findById(progressId);
        if (!progress) {
          span.setAttribute("progress.found", true);
          throw new ProgressNotFoundException(`Progress ${progressId} not found`);
        }

        this.logger.log(`Progress ${progressId} fetched`, {
          ctx: GetProgressUseCase.name,
        });
        return ProgressDto.fromDomain(progress);
      },
    );
  }
}
