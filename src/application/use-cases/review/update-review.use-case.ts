import { Injectable } from "@nestjs/common";
import { ReviewDto } from "src/application/dtos/review.dto";
import {
  CourseNotFoundException,
  EnrollmentNotFoundException,
  ReviewNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { UpdateReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class UpdateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  async execute(dto: UpdateReviewRequest): Promise<ReviewDto> {
    return await this.tracer.startActiveSpan(
      "UpdateReviewUseCase.execute",
      async (span) => {
        const { comment, enrollmentId, rating, reviewId, userId } = dto;
        span.setAttributes({
          "review.id": reviewId,
        });
        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          this.logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: UpdateReviewUseCase.name }
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
          { ctx: UpdateReviewUseCase.name }
        );

        // Check if course exists
        const course = await this.courseRepository.findById(courseId, { withSections: false });
        if (!course) {
          this.logger.warn(
            `Course with ID ${courseId} not found for enrollment ${enrollmentId}`,
            { ctx: UpdateReviewUseCase.name }
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
            { ctx: UpdateReviewUseCase.name }
          );
          throw new EnrollmentNotFoundException(
            `Enrollment-user-course mismatch`
          );
        }

        this.logger.log(`Updating review ${reviewId}`, {
          ctx: UpdateReviewUseCase.name,
        });

        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(`Review ${reviewId} not found`);
        }

        // Update rating in course entity
        const oldRating = review.getRating();
        course.changeRating(oldRating, rating);

        review.update(rating, comment);
        review.validateRating();

        // await Promise.all([
        await this.reviewRepository.save(review);
        await this.courseRepository.update(course);
        // ]);
        span.setAttribute("review.updated", true);

        this.logger.log(`Review ${reviewId} updated`, {
          ctx: UpdateReviewUseCase.name,
        });
        return ReviewDto.fromDomain(review);
      }
    );
  }
}
