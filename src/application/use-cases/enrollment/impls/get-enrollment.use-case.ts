import { Injectable } from "@nestjs/common";
import { EnrollmentDto } from "src/application/dtos/enrollment.dto";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IGetEnrollmentUseCase } from "../interfaces/get-enrollment.interface";

@Injectable()
export class GetEnrollmentUseCase implements IGetEnrollmentUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(enrollmentId: string, userId: string): Promise<EnrollmentDto> {
    return await this._tracer.startActiveSpan(
      "GetEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });
         this._logger.log(`Fetching enrollment ${enrollmentId}`, {
          ctx: GetEnrollmentUseCase.name,
        });

        const enrollment = await this._enrollmentRepository.findByIdAndUser(
          enrollmentId,
          userId,
          { includeCourse: true },
        );

        if (!enrollment) {
          throw new EnrollmentNotFoundException(
            `Enrollment not found with id ${enrollmentId}`,
          );
        }
        if (enrollment.getStudentId() !== userId) {
          throw new UnauthorizedException(
            `User ${userId} is not authorized to access enrollment ${enrollmentId}`,
          );
        }

         this._logger.log(`Enrollment ${enrollmentId} fetched`, {
          ctx: GetEnrollmentUseCase.name,
        });
        return EnrollmentDto.fromDomain(enrollment);
      },
    );
  }
}
