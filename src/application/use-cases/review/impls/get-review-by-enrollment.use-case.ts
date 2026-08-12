import { Injectable } from "@nestjs/common";
import { Review } from "src/domain/entities/review.entity";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { ReviewNotFoundException } from "src/domain/exceptions/review.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { GetReviewByEnrollmentRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IGetReviewByEnrollmentUseCase } from "../interfaces/get-review-by-enrollment.interface";

@Injectable()
export class GetReviewByEnrollmentUseCase implements IGetReviewByEnrollmentUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: GetReviewByEnrollmentRequest): Promise<Review> {
    return await this._tracer.startActiveSpan(
      "GetReviewByEnrollmentUseCase.execute",
      async (span) => {
        const { enrollmentId, userId } = dto;
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });
        this._logger.debug(`Fetching enrollment ${enrollmentId}`, {
          ctx: GetReviewByEnrollmentUseCase.name,
        });
        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          this._logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: GetReviewByEnrollmentUseCase.name },
          );
          throw new EnrollmentNotFoundException(
            `Enrollment with ID ${enrollmentId} not found`,
          );
        }

        if (enrollment.getStudentId() !== userId) {
          this._logger.error(
            `Enrollment info mismatch for enrollmentId=${enrollmentId}, userId=${userId}`,
            { ctx: GetReviewByEnrollmentUseCase.name },
          );
          throw new UnauthorizedException(`Enrollment-user-course mismatch`);
        }

        const review =
          await this._reviewRepository.findByEnrollmentId(enrollmentId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(
            `Not found review by enrollment id ${enrollmentId}`,
          );
        }
        this._logger.debug(`found review by enrollment id ${enrollmentId} `, {
          ctx: GetReviewByEnrollmentUseCase.name,
        });

        span.setAttribute("review.found", true);
        return review;
      },
    );
  }
}
