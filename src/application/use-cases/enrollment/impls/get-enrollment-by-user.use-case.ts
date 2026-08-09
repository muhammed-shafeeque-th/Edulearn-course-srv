import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetEnrollmentsByUserUseCase } from "../interfaces/get-enrollment-by-user.interface";
import { Enrollment } from "@/domain/entities/enrollment.entity";

@Injectable()
export class GetEnrollmentsByUserUseCase implements IGetEnrollmentsByUserUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(userId: string): Promise<Enrollment[]> {
    return await this._tracer.startActiveSpan(
      "GetEnrollmentsByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });
        this._logger.log(`Fetching enrollments by user ${userId}`, {
          ctx: GetEnrollmentsByUserUseCase.name,
        });

        const enrollments =
          await this._enrollmentRepository.listEnrollmentsByUser(userId, {
            includeCourse: true,
            includeProgressSummary: true,
          });

        this._logger.log(`Enrollments of user ${userId} fetched`, {
          ctx: GetEnrollmentsByUserUseCase.name,
        });
        return enrollments;
      },
    );
  }
}
