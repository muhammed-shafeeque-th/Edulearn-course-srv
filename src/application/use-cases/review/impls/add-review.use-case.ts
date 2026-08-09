import { Injectable } from "@nestjs/common";
import { Review } from "src/domain/entities/review.entity";
import { User } from "src/domain/entities/user.entity";
import { CourseReviewSubmittedEvent } from "src/domain/events/review.events";
import { AlreadyReviewedException } from "src/domain/exceptions/review.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { SubmitCourseReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { KafkaTopics } from "src/shared/events/event.topics";
import { v4 as uuidV4 } from "uuid";
import { ReviewEntityMapper } from "src/infrastructure/database/mappers/review.entity.mapper";
import { CourseEntityMapper } from "src/infrastructure/database/mappers/course.entity.mapper";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IAddReviewUseCase } from "../interfaces/add-review.interface";

@Injectable()
export class AddReviewUseCase implements IAddReviewUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: SubmitCourseReviewRequest): Promise<Review> {
    return this._tracer.startActiveSpan(
      "AddReviewUseCase.execute",
      async (span) => {
        const { comment, enrollmentId, rating, userId, user } = dto;
        // Fetch enrollment and courseId in one db call if possible for optimization
        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          this._logger.warn(
            `Enrollment with ID ${enrollmentId} not found for user ${userId}`,
            { ctx: AddReviewUseCase.name },
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
          { ctx: AddReviewUseCase.name },
        );

        // Check if course exists
        const course = await this._courseRepository.findById(courseId);
        if (!course) {
          this._logger.warn(
            `Course with ID ${courseId} not found for enrollment ${enrollmentId}`,
            { ctx: AddReviewUseCase.name },
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
            { ctx: AddReviewUseCase.name },
          );
          throw new UnauthorizedException(`Enrollment-user-course mismatch`);
        }

        // Check if user already reviewed this enrollment/course
        const existingReview = await this._reviewRepository.findByUserAndCourse(
          userId,
          courseId,
        );
        if (existingReview) {
          this._logger.warn(
            `User ${userId} has already reviewed course ${courseId}`,
            { ctx: AddReviewUseCase.name },
          );
          throw new AlreadyReviewedException(
            `User ${userId} has already reviewed this course`,
          );
        }

        const reviewedUser = new User(
          user.id,
          user.name,
          user.avatar,
          user.email,
        );

        // Create new review instance (include enrollmentId)
        const review = new Review(
          uuidV4(),
          userId,
          reviewedUser,
          courseId,
          enrollmentId,
          rating,
          comment,
        );

        // Update course rating before saving
        course.rateCourse(rating);

        (await this._reviewRepository.save(review),
          await this._courseRepository.save(course),
          // await Promise.all([
          // ]);

          // await this._courseRepository.transaction(async (manager) => {
          //   await manager.save(ReviewEntityMapper.toOrmReview(review));
          //   await manager.save(CourseEntityMapper.toOrmCourse(course));
          // });

          // Publish review event to Kafka asynchronously (do not slow main flow by awaiting errors)
          this._kafkaProducer
            .produce<CourseReviewSubmittedEvent>(
              KafkaTopics.CourseReviewSubmitted,
              {
                key: course.getId(),
                value: {
                  eventId: uuidV4(),
                  timestamp: Date.now(),
                  source: "course-service",
                  eventType: "CourseReviewSubmittedEvent",
                  payload: {
                    userId,
                    courseId,
                    enrollmentId,
                    reviewId: review.getId(),
                    rating,
                    comment,
                    reviewedAt: new Date().toISOString(),
                  },
                },
              },
            )
            .catch((err) => {
              this._logger.error(
                `Failed to send COURSE_REVIEWED event to Kafka: ${err.message}`,
                { error: err, ctx: AddReviewUseCase.name },
              );
            }));

        this._logger.log(
          `Review added for course ${courseId} by user ${userId}`,
          { ctx: AddReviewUseCase.name },
        );
        return review;
      },
    );
  }
}
