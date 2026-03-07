import { Injectable } from "@nestjs/common";
import {
  CourseNotFoundException,
  EnrollmentNotFoundException,
  ReviewNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { DeleteReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(dto: DeleteReviewRequest): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteReviewUseCase.execute",
      async (span) => {
        const { enrollmentId, reviewId, userId } = dto;
        span.setAttributes({
          "review.id": reviewId,
        });

        this.logger.log(`Deleting review ${reviewId}`, {
          ctx: DeleteReviewUseCase.name,
        });

        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          this.logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: DeleteReviewUseCase.name }
          );
          throw new EnrollmentNotFoundException(
            `Enrollment with ID ${enrollmentId} not found`
          );
        }
        const courseId = enrollment.getCourseId();

        span.setAttributes({
          "user.id": userId,
          "course.id": courseId,
          "enrollment.id": enrollmentId,
        });

        this.logger.log(
          `Adding review by user ${userId} for course ${courseId}`,
          { ctx: DeleteReviewUseCase.name }
        );

        // Check if course exists
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
          this.logger.warn(
            `Course with ID ${courseId} not found for enrollment ${enrollmentId}`,
            { ctx: DeleteReviewUseCase.name }
          );
          throw new CourseNotFoundException(
            `Course with ID ${courseId} not found`
          );
        }

        // Double check that the enrollment is for this user and course (defensive)
        if (
          enrollment.getStudentId() !== userId ||
          enrollment.getCourseId() !== courseId
        ) {
          this.logger.error(
            `Enrollment info mismatch for enrollmentId=${enrollmentId}, userId=${userId}, courseId=${courseId}`,
            { ctx: DeleteReviewUseCase.name }
          );
          throw new EnrollmentNotFoundException(
            `Enrollment-user-course mismatch`
          );
        }

        this.logger.log(`Updating review ${reviewId}`, {
          ctx: DeleteReviewUseCase.name,
        });

        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(`Review ${reviewId} not found`);
        }

        // Update rating in course entity
        const rating = review.getRating();
        course.removeRating(rating);

        await Promise.all([
          this.reviewRepository.delete(review),
          this.courseRepository.update(course),
        ]);
        span.setAttribute("review.deleted", true);

        this.logger.log(`Review ${reviewId} deleted`, {
          ctx: DeleteReviewUseCase.name,
        });
      }
    );
  }
}
