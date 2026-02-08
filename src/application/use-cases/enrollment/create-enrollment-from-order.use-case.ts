import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  Enrollment,
  EnrollmentStatus,
} from "src/domain/entities/enrollment.entity";
import { UnitType, Progress } from "src/domain/entities/progress.entity";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import OrderCompletedEventDTO from "src/presentation/kafka/dtos/order-complete.event-dto";
import {
  EnrollmentCreatedEvent,
} from "src/domain/events/enrollment.events";
import { KafkaTopics } from "src/shared/events/event.topics";
import { v4 as uuidV4 } from "uuid";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import { InAppNotificationEvent } from "src/domain/events/other-events";
import { OrderCompletedEvent } from "src/domain/events/order-events";

@Injectable()
export class CreateEnrollmentFromOrderUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  /**
   * Processes an OrderCompletedEvent and creates enrollments for all items in the order.
   * Ensures idempotency and robust error handling.
   */
  async execute(event: OrderCompletedEvent): Promise<void> {
    const payload = event.payload;
    if (
      !payload ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      this.logger.warn("Order payload is empty or malformed.", {
        orderId: payload?.orderId,
      });
      return;
    }

    // Idempotency: skip if already processed
   

    for (const item of payload.items) {
      try {
        // Skip/deduplicate if enrollment already exists
        const existing = await this.enrollmentRepo.getByUserAndCourse(
          payload.userId,
          item.courseId,
          { includeCourse: false, includeProgressSummary: false }
        );
        if (existing) {
          this.logger.warn(
            `User [${payload.userId}] already enrolled into course [${item.courseId}], skipping.`
          );
          continue;
        }

        const course = await this.courseRepo.findById(item.courseId);
        if (!course) {
          this.logger.warn(
            `Course [${item.courseId}] not found, skipping enrollment.`
          );
          continue;
        }

        const enrollmentId = uuidV4();
        const progressEntries: Progress[] = [];

        for (const section of course.getSections()) {
          for (const lesson of section.getLessons()) {
            progressEntries.push(
              new Progress(
                uuidV4(),
                enrollmentId,
                lesson.getId(),
                undefined,
                UnitType.LESSON
              )
            );
          }
          const quiz = section.getQuiz();
          if (quiz) {
            progressEntries.push(
              new Progress(
                uuidV4(),
                enrollmentId,
                undefined,
                quiz.getId(),
                UnitType.QUIZ
              )
            );
          }
        }

        const totalLearningUnits = progressEntries.length;

        const idempotencyKey = uuidV4()

        const enrollment = new Enrollment(
          enrollmentId,
          payload.userId,
          item.courseId,
          payload.orderId,
          course.getInstructorId(),
          idempotencyKey,
          new Date(),
          EnrollmentStatus.ACTIVE,
          0,
          undefined,
          new Date(),
          new Date(),
          undefined,
          progressEntries,
          totalLearningUnits,
          0
        );

        await this.enrollmentRepo.upsert(enrollment);
        this.logger.log(
          `Enrollment [${enrollmentId}] created for user [${payload.userId}] in course [${item.courseId}].`
        );

        course.incrementEnrollment();
        await this.courseRepo.save(course);

        // Publish related events (Kafka)
        await this.publishCourseEnrolledEvents(
          enrollment,
          course.getInstructorId(),
          payload.amount
        );

      
      } catch (error) {
        this.logger.error(
          `Failed to create enrollment for user [${payload.userId}] and course [${item.courseId}]: ${error?.message}`,
          error?.stack
        );
        // Optionally, propagate error or collect failed operations for alerting
      }
    }
  }

  /**
   * Publishes EnrollmentCreatedEvent and in-app notification event to Kafka.
   */
  private async publishCourseEnrolledEvents(
    enrollment: Enrollment,
    instructorId: string,
    amount: number
  ): Promise<void> {
    try {
      await this.kafkaProducer.produce<EnrollmentCreatedEvent>(
        KafkaTopics.CourseEnrollmentCreated,
        {
          key: enrollment.getCourseId(),
          value: {
            eventId: uuidV4(),
            timestamp: Date.now(),
            source: "course-service",
            eventType: "EnrollmentCreatedEvent",
            payload: {

              courseId: enrollment.getCourseId(),
              enrolledAt: enrollment.getEnrolledAt().toISOString(),
              enrollmentId: enrollment.getId(),
              instructorId: instructorId,
              orderId: enrollment.getOrderId(),
              orderPrice: amount,
              timestamp: Date.now(),
              studentId: enrollment.getStudentId(),
            },
          }
        }
      );
    } catch (error) {
      this.logger.error(
        "Failed to publish EnrollmentCreatedEvent to Kafka",
        error?.stack
      );
      throw error;
    }

    try {
      await this.kafkaProducer.produce<InAppNotificationEvent>(
        KafkaTopics.NotificationInAppChannel,
        {

          key: enrollment.getCourseId(),
          value: {
            eventId: uuidV4(),
            timestamp: Date.now(),
            source: "course-service",
            eventType: "CourseEnrollmentEvent",
            payload: {

              userId: enrollment.getStudentId(),
              title: "Enrollment Successful! 🎓",
              message: `You've been successfully enrolled in your new course. Start learning now!`,
              type: "course_enrollment",
              actionUrl: `/learn/${enrollment.getId()}`,
              icon: "school",
              priority: "high",
              appId: "Course",
              category: "enrollment",
            },
          },
        }
      );
    } catch (error) {
      this.logger.error("Error while publishing InAppNotification event", {
        error,
      });
    }
  }

  // private async getLessonsForCourse(courseId: string): Promise<LessonDTO[]> {
  //   try {
  //     // Fetch all lessons for the given courseId
  //     const lessons = await this.lessonRepository.findByCourseId(courseId);

  //     if (!lessons) {
  //       this.logger.warn(
  //         `Lesson repository returned null/undefined for courseId=${courseId}`
  //       );
  //       throw new NotFoundException(
  //         `Course ${courseId} not found or contains no lessons`
  //       );
  //     }

  //     // Filter to include only published lessons
  //     const publishedLessons = lessons
  //       .filter((lesson) => lesson.getIsPublished())
  //       .sort((a, b) => a.getOrder() - b.getOrder());

  //     if (publishedLessons.length === 0) {
  //       this.logger.warn(`No published lessons found for courseId=${courseId}`);
  //       return [];
  //     }

  //     this.logger.debug(
  //       `Found ${publishedLessons.length} published lessons for courseId=${courseId}`
  //     );
  //     // Optionally, map to only include .id if you prefer
  //     return publishedLessons.map((lesson) => ({
  //       id: lesson.getId(),
  //       title: lesson.getTitle(),
  //       order: lesson.getOrder(),
  //       isPublished: lesson.getIsPublished(),
  //     }));
  //   } catch (err) {
  //     if (err instanceof NotFoundException) {
  //       throw err;
  //     }
  //     this.logger.error(
  //       `Error retrieving lessons for courseId=${courseId}: ${err?.message}`,
  //       err?.stack
  //     );
  //     throw new InternalServerErrorException(
  //       `Could not retrieve lessons for course ${courseId}`
  //     );
  //   }
  // }
}
