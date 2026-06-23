import { Injectable } from "@nestjs/common";
import { ProgressNotFoundException } from "src/domain/exceptions/progress.exceptions";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IDeleteProgressUseCase } from "../interfaces/delete-progress.interface";

@Injectable()
export class DeleteProgressUseCase implements IDeleteProgressUseCase {
  constructor(
    private readonly _progressRepository: IProgressRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(progressId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "progress.id": progressId,
        });

         this._logger.log(`Deleting progress ${progressId}`, {
          ctx: DeleteProgressUseCase.name,
        });

        const progress = await this._progressRepository.findById(progressId);
        if (!progress) {
          span.setAttribute("progress.found", false);
          throw new ProgressNotFoundException(
            `Progress ${progressId} not found`,
          );
        }
        span.setAttribute("progress.found", true);

        await this._progressRepository.delete(progress);
         this._logger.log(`Progress ${progressId} deleted`, {
          ctx: DeleteProgressUseCase.name,
        });
      },
    );
  }
}
