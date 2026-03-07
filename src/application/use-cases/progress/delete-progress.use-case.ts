import { Injectable } from "@nestjs/common";
import { ProgressNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class DeleteProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(progressId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "progress.id": progressId,
        });

        this.logger.log(`Deleting progress ${progressId}`, {
          ctx: DeleteProgressUseCase.name,
        });

        const progress = await this.progressRepository.findById(progressId);
        if (!progress) {
          span.setAttribute("progress.found", false);
          throw new ProgressNotFoundException(`Progress ${progressId} not found`);
        }
        span.setAttribute("progress.found", true);

        await this.progressRepository.delete(progress);
        this.logger.log(`Progress ${progressId} deleted`, {
          ctx: DeleteProgressUseCase.name,
        });
      },
    );
  }
}
