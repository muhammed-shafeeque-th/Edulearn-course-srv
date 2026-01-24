import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import {
  CourseNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { KafkaTopics } from "src/shared/events/event.topics";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { v4 as uuidV4 } from "uuid";
import { CourseDto } from "src/application/dtos/course.dto";
import { PublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CoursePublishedEvent } from "src/domain/events/course-lifecycle.events";

@Injectable()
export class PublishCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly eventProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  /**
   * Publishes a course if the user is authorized (isAdmin or instructor of the course).
   * Also emits a CoursePublishedEvent upon success.
   *
   * @param cmd - PublishCourseRequest with courseId, userId, isAdmin
   * @returns Published CourseDto
   * @throws CourseNotFoundException | UnauthorizedException
   */
  async execute(cmd: PublishCourseRequest): Promise<CourseDto> {
    return this.tracer.startActiveSpan(
      `${PublishCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, userId, isAdmin } = cmd;

        this.logger.info("Attempting to publish course", {
          ctx: PublishCourseUseCase.name,
          courseId,
          userId,
        });

        // Validation: courseId must exist
        if (!courseId) {
          const msg = "courseId is required for publishing a course";
          this.logger.error(msg, { ctx: PublishCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        // Find course
        const course = await this.courseRepository.findById(courseId);

        if (!course) {
          const warnMsg = `Course ${courseId} not found.`;
          this.logger.warn(warnMsg, {
            ctx: PublishCourseUseCase.name,
            courseId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new CourseNotFoundException(courseId);
        }

        // Authorization: Allow if isAdmin or instructor of the course
        if (!isAdmin && course.getInstructorId() !== userId) {
          const warnMsg = `User ${userId ?? "unknown"} unauthorized to publish course ${courseId}.`;
          this.logger.warn(warnMsg, {
            ctx: PublishCourseUseCase.name,
            courseId,
            userId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new UnauthorizedException(
            "You are not authorized to publish this course"
          );
        }

        try {
          span?.setAttribute("course.id", courseId);

          // Publish the course via domain method
          course.publishCourse();

          // Save
          await this.courseRepository.update(course);

          span?.setAttribute("course.published", true);

          // Emit event after publishing
          await this.eventProducer.produce<CoursePublishedEvent>(
            KafkaTopics.CoursePublished,
            {
              key: course.getId(),
              value: {
                eventType: "CoursePublishedEvent",
                eventId: uuidV4(),
                timestamp: Date.now(),
                source: "course-service",
                payload: {
                  instructorId: course.getInstructorId(),
                  courseId: course.getId(),
                  slug: course.getSlug(),
                  status: course.getStatus(),
                  title: course.getTitle(),
                  updatedAt: course.getUpdatedAt()?.toISOString?.() || "",
                }
              }
            }
          );

          this.logger.info("Course published successfully.", {
            ctx: PublishCourseUseCase.name,
            courseId,
            userId,
          });

          return CourseDto.fromDomain(course);
        } catch (error) {
          span?.setAttribute("error", true);
          span?.setAttribute(
            "error.message",
            error?.message ?? "Unknown error"
          );
          this.logger.error(
            `Failed to publish course ${courseId}: ${error?.message}`,
            {
              ctx: PublishCourseUseCase.name,
              error,
              courseId,
              userId,
            }
          );
          throw error;
        }
      }
    );
  }
}
