import { Injectable } from "@nestjs/common";
import { Review } from "src/domain/entities/review.entity";
import { ReviewNotFoundException } from "src/domain/exceptions/certificate.exceptions";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { UpdateReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IUpdateReviewUseCase } from "../interfaces/update-review.interface";

@Injectable()
export class UpdateReviewUseCase implements IUpdateReviewUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateReviewRequest): Promise<Review> {
    return await this._tracer.startActiveSpan(
      "UpdateReviewUseCase.execute",
      async (span) => {
        const { comment, enrollmentId, rating, reviewId, userId } = dto;
        span.setAttributes({
          "review.id": reviewId,
        });
        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          this._logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: UpdateReviewUseCase.name },
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

        this._logger.log(
          `Adding review by user ${userId} for course ${courseId}`,
          { ctx: UpdateReviewUseCase.name },
        );

        // Check if course exists
        const course = await this._courseRepository.findById(courseId, {
          withModules: false,
        });
        if (!course) {
          this._logger.warn(
            `Course with ID ${courseId} not found for enrollment ${enrollmentId}`,
            { ctx: UpdateReviewUseCase.name },
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
            { ctx: UpdateReviewUseCase.name },
          );
          throw new UnauthorizedException(`Enrollment-user-course mismatch`);
        }

        this._logger.log(`Updating review ${reviewId}`, {
          ctx: UpdateReviewUseCase.name,
        });

        const review = await this._reviewRepository.findById(reviewId);
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
        await this._reviewRepository.save(review);
        await this._courseRepository.update(course);
        // ]);
        span.setAttribute("review.updated", true);

        this._logger.log(`Review ${reviewId} updated`, {
          ctx: UpdateReviewUseCase.name,
        });
        return review;
      },
    );
  }
}
