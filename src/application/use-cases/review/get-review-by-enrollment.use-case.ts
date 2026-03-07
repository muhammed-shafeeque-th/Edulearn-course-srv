import { Injectable } from "@nestjs/common";
import { ReviewDto } from "src/application/dtos/review.dto";
import {
  EnrollmentNotFoundException,
  ReviewNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { GetReviewByEnrollmentRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetReviewByEnrollmentUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(dto: GetReviewByEnrollmentRequest): Promise<ReviewDto> {
    return await this.tracer.startActiveSpan(
      "GetReviewByEnrollmentUseCase.execute",
      async (span) => {
        const { enrollmentId, userId } = dto;
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });
        this.logger.log(`Fetching enrollment ${enrollmentId}`, {
          ctx: GetReviewByEnrollmentUseCase.name,
        });
        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          this.logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: GetReviewByEnrollmentUseCase.name }
          );
          throw new EnrollmentNotFoundException(
            `Enrollment with ID ${enrollmentId} not found`
          );
        }

        if (enrollment.getStudentId() !== userId) {
          this.logger.error(
            `Enrollment info mismatch for enrollmentId=${enrollmentId}, userId=${userId}`,
            { ctx: GetReviewByEnrollmentUseCase.name }
          );
          throw new EnrollmentNotFoundException(
            `Enrollment-user-course mismatch`
          );
        }

        const review =
          await this.reviewRepository.findByEnrollmentId(enrollmentId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(
            `Not found review by enrollment id ${enrollmentId}`
          );
        }
        this.logger.log(`found review by enrollment id ${enrollmentId} `, {
          ctx: GetReviewByEnrollmentUseCase.name,
        });

        span.setAttribute("review.found", true);
        return ReviewDto.fromDomain(review);
      }
    );
  }
}
