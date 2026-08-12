import { Injectable } from "@nestjs/common";
import { Progress } from "src/domain/entities/progress.entity";
import { ProgressNotFoundException } from "src/domain/exceptions/progress.exceptions";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetProgressUseCase } from "../interfaces/get-progress.interface";

@Injectable()
export class GetProgressUseCase implements IGetProgressUseCase {
  constructor(
    private readonly _progressRepository: IProgressRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(progressId: string): Promise<Progress> {
    return await this._tracer.startActiveSpan(
      "GetProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "progress.id": progressId,
        });

        this._logger.debug(`Fetching progress ${progressId}`, {
          ctx: GetProgressUseCase.name,
        });

        const progress = await this._progressRepository.findById(progressId);
        if (!progress) {
          span.setAttribute("progress.found", true);
          throw new ProgressNotFoundException(
            `Progress ${progressId} not found`,
          );
        }

        this._logger.debug(`Progress ${progressId} fetched`, {
          ctx: GetProgressUseCase.name,
        });
        return progress;
      },
    );
  }
}
