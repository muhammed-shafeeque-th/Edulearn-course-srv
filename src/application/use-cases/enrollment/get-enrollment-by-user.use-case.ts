import { Injectable } from "@nestjs/common";
import { EnrollmentDto } from "src/application/dtos/enrollment.dto";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetEnrollmentsByUserUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(userId: string): Promise<EnrollmentDto[]> {
    return await this.tracer.startActiveSpan(
      "GetEnrollmentsByUserUseCase.execute",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });
        this.logger.log(`Fetching enrollments by user ${userId}`, {
          ctx: GetEnrollmentsByUserUseCase.name,
        });

        const enrollments = await this.enrollmentRepository.listEnrollmentsByUser(userId, {
          includeCourse: true,
          includeProgressSummary: true,
        });


        this.logger.log(`Enrollments of user ${userId} fetched`, {
          ctx: GetEnrollmentsByUserUseCase.name,
        });
        return enrollments.map(EnrollmentDto.fromDomain);
      },
    );
  }
}
