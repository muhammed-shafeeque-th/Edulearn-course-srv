import { Injectable } from "@nestjs/common";
import { EnrollmentDto } from "src/application/dtos/enrollment.dto";
import {
  EnrollmentNotFoundException,
  NotAuthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(enrollmentId: string, userId: string): Promise<EnrollmentDto> {
    return await this.tracer.startActiveSpan(
      "GetEnrollmentUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });
        this.logger.log(`Fetching enrollment ${enrollmentId}`, {
          ctx: GetEnrollmentUseCase.name,
        });

        const enrollment = await this.enrollmentRepository.getByIdAndUser(
          enrollmentId,
          userId,
          { includeCourse: true }
        );

        if (!enrollment) {
          throw new EnrollmentNotFoundException(
            `Enrollment not found with id ${enrollmentId}`
          );
        }
        if (enrollment.getStudentId() !== userId) {
          throw new NotAuthorizedException(
            `User ${userId} is not authorized to access enrollment ${enrollmentId}`
          );
        }


        this.logger.log(`Enrollment ${enrollmentId} fetched`, {
          ctx: GetEnrollmentUseCase.name,
        });
        return EnrollmentDto.fromDomain(enrollment);
      }
    );
  }
}
