import { Injectable } from "@nestjs/common";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { ReviewNotFoundException } from "src/domain/exceptions/review.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { DeleteReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IDeleteReviewUseCase } from "../interfaces/delete-review.interface";

@Injectable()
export class DeleteReviewUseCase implements IDeleteReviewUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: DeleteReviewRequest): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteReviewUseCase.execute",
      async (span) => {
        const { enrollmentId, reviewId, userId } = dto;
        span.setAttributes({
          "review.id": reviewId,
        });

        this._logger.debug(`Deleting review ${reviewId}`, {
          ctx: DeleteReviewUseCase.name,
        });

        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          this._logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: DeleteReviewUseCase.name },
          );
          throw new EnrollmentNotFoundException(
            `Enrollment with ID ${enrollmentId} not found`,
          );
        }
        const courseId = enrollment.getCourseId();

        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
          "enrollment.id": enrollmentId,
        });

        this._logger.debug(
          `Adding review by user ${userId} for course ${courseId}`,
          { ctx: DeleteReviewUseCase.name },
        );

        // Check if course exists
        const course = await this._courseRepository.findById(courseId);
        if (!course) {
          this._logger.warn(
            `Course with ID ${courseId} not found for enrollment ${enrollmentId}`,
            { ctx: DeleteReviewUseCase.name },
          );
          throw new CourseNotFoundException(
            `Course with ID ${courseId} not found`,
          );
        }

        // Double check that the enrollment is for this user and course (defensive)
        if (
          enrollment.getStudentId() !== userId ||
          enrollment.getCourseId() !== courseId
        ) {
          this._logger.error(
            `Enrollment info mismatch for enrollmentId=${enrollmentId}, userId=${userId}, courseId=${courseId}`,
            { ctx: DeleteReviewUseCase.name },
          );
          throw new EnrollmentNotFoundException(
            `Enrollment-user-course mismatch`,
          );
        }

        this._logger.debug(`Updating review ${reviewId}`, {
          ctx: DeleteReviewUseCase.name,
        });

        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(`Review ${reviewId} not found`);
        }

        // Update rating in course entity
        const rating = review.getRating();
        course.removeRating(rating);

        await Promise.all([
          this._reviewRepository.delete(review),
          this._courseRepository.update(course),
        ]);
        span.setAttribute("review.deleted", true);

        this._logger.debug(`Review ${reviewId} deleted`, {
          ctx: DeleteReviewUseCase.name,
        });
      },
    );
  }
}
