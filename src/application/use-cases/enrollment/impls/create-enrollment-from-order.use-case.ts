import { Injectable } from "@nestjs/common";
import {
  Enrollment,
  EnrollmentStatus,
} from "src/domain/entities/enrollment.entity";
import { UnitType, Progress } from "src/domain/entities/progress.entity";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { EnrollmentCreatedEvent } from "src/domain/events/enrollment.events";
import { KafkaTopics } from "src/shared/events/event.topics";
import { v4 as uuidV4 } from "uuid";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import { InAppNotificationEvent } from "src/domain/events/other-events";
import { OrderCompletedEvent } from "src/domain/events/order-events";
import { ICreateEnrollmentFromOrderUseCase } from "../interfaces/create-enrollment-from-order.interface";

@Injectable()
export class CreateEnrollmentFromOrderUseCase implements ICreateEnrollmentFromOrderUseCase {
  constructor(
    private readonly _enrollmentRepo: IEnrollmentRepository,
    private readonly _courseRepo: ICourseRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(event: OrderCompletedEvent): Promise<void> {
    const payload = event.payload;
    if (
      !payload ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      this._logger.warn("Order payload is empty or malformed.", {
        orderId: payload?.orderId,
      });
      return;
    }

    for (const item of payload.items) {
      try {
        // Skip/deduplicate if enrollment already exists
        const existing = await this._enrollmentRepo.findByUserAndCourse(
          payload.userId,
          item.courseId,
          { includeCourse: false, includeProgressSummary: false },
        );
        if (existing) {
          this._logger.warn(
            `User [${payload.userId}] already enrolled into course [${item.courseId}], skipping.`,
          );
          continue;
        }

        const course = await this._courseRepo.findById(item.courseId);
        if (!course) {
          this._logger.warn(
            `Course [${item.courseId}] not found, skipping enrollment.`,
          );
          continue;
        }

        const enrollmentId = uuidV4();
        const progressEntries: Progress[] = [];

        for (const module of course.getModules()) {
          for (const lesson of module.getLessons()) {
            progressEntries.push(
              new Progress(
                uuidV4(),
                enrollmentId,
                lesson.getId(),
                undefined,
                UnitType.LESSON,
              ),
            );
          }
          const quiz = module.getQuiz();
          if (quiz) {
            progressEntries.push(
              new Progress(
                uuidV4(),
                enrollmentId,
                undefined,
                quiz.getId(),
                UnitType.QUIZ,
              ),
            );
          }
        }

        const totalLearningUnits = progressEntries.length;

        const idempotencyKey = uuidV4();

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
          0,
        );

        await this._enrollmentRepo.upsert(enrollment);
        this._logger.debug(
          `Enrollment [${enrollmentId}] created for user [${payload.userId}] in course [${item.courseId}].`,
        );

        course.incrementEnrollment();
        await this._courseRepo.save(course);

        // Publish related events (Kafka)
        await this.publishCourseEnrolledEvents(
          enrollment,
          course.getInstructorId(),
          payload.amount,
        );
      } catch (error: any) {
        this._logger.error(
          `Failed to create enrollment for user [${payload.userId}] and course [${item.courseId}]: ${error?.message}`,
          error?.stack,
        );
      }
    }
  }

  private async publishCourseEnrolledEvents(
    enrollment: Enrollment,
    instructorId: string,
    amount: number,
  ): Promise<void> {
    try {
      await this._kafkaProducer.produce<EnrollmentCreatedEvent>(
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
          },
        },
      );
    } catch (error: any) {
      this._logger.error(
        "Failed to publish EnrollmentCreatedEvent to Kafka",
        error?.stack,
      );
      throw error;
    }

    try {
      await this._kafkaProducer.produce<InAppNotificationEvent>(
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
        },
      );
    } catch (error) {
      this._logger.error("Error while publishing InAppNotification event", {
        error,
      });
    }
  }

  // private async getLessonsForCourse(courseId: string): Promise<Lesson[]> {
  //   try {
  //     // Fetch all lessons for the given courseId
  //     const lessons = await this._lessonRepository.findByCourseId(courseId);

  //     if (!lessons) {
  //        this._logger.warn(
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
  //        this._logger.warn(`No published lessons found for courseId=${courseId}`);
  //       return [];
  //     }

  //      this._logger.debug(
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
  //      this._logger.error(
  //       `Error retrieving lessons for courseId=${courseId}: ${err?.message}`,
  //       err?.stack
  //     );
  //     throw new InternalServerErrorException(
  //       `Could not retrieve lessons for course ${courseId}`
  //     );
  //   }
  // }
}
