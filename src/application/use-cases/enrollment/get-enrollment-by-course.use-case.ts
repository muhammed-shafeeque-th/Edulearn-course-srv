import { Injectable } from "@nestjs/common";
import { EnrollmentDto } from "src/application/dtos/enrollment.dto";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetEnrollmentsByCourseUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(courseId: string): Promise<EnrollmentDto[]> {
    return await this.tracer.startActiveSpan(
      "GetEnrollmentsByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this.logger.log(`Fetching enrollments by course ${courseId}`, {
          ctx: GetEnrollmentsByCourseUseCase.name,
        });

        const enrollments =
          await this.enrollmentRepository.listEnrollmentsByCourse(courseId);

        span.setAttribute("course.enrollment.count", enrollments.length);

        this.logger.log(`Enrollments by course ${courseId} fetched`, {
          ctx: GetEnrollmentsByCourseUseCase.name,
        });
        return enrollments.map(EnrollmentDto.fromDomain);
      },
    );
  }
}
