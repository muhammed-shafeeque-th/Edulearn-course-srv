import { Injectable } from "@nestjs/common";
import { statSync } from "fs";
import { Progress } from "src/domain/entities/progress.entity";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetProgressesByEnrollmentUseCase } from "../interfaces/get-progress-by-enrollment.interface";

@Injectable()
export class GetProgressesByEnrollmentUseCase implements IGetProgressesByEnrollmentUseCase {
  constructor(
    private readonly _progressRepository: IProgressRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(enrollmentId: string): Promise<Progress[]> {
    return await this._tracer.startActiveSpan(
      "GetProgressesByEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

        this._logger.debug(`Fetching progress by enrollment ${enrollmentId}`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });

        const progresses =
          await this._progressRepository.findByEnrollmentId(enrollmentId);

        this._logger.debug(`Progresses of enrolment ${enrollmentId} fetched`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });
        return progresses;
      },
    );
  }
}
