import { Injectable } from "@nestjs/common";
import { statSync } from "fs";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetProgressesByEnrollmentUseCase } from "../interfaces/get-progress-by-enrollment.interface";

@Injectable()
export class GetProgressesByEnrollmentUseCase
  implements IGetProgressesByEnrollmentUseCase
{
  constructor(
    private readonly _progressRepository: IProgressRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(enrollmentId: string): Promise<ProgressDto[]> {
    return await this._tracer.startActiveSpan(
      "GetProgressesByEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

         this._logger.log(`Fetching progress by enrollment ${enrollmentId}`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });

        const progresses =
          await this._progressRepository.findByEnrollmentId(enrollmentId);

         this._logger.log(`Progresses of enrolment ${enrollmentId} fetched`, {
          ctx: GetProgressesByEnrollmentUseCase.name,
        });
        return progresses.map(ProgressDto.fromDomain);
      },
    );
  }
}
