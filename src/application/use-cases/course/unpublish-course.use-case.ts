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
import { UnPublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CourseUnPublishedEvent } from "src/domain/events/course-lifecycle.events";

@Injectable()
export class UnPublishCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly eventProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  /**
   * Unpublishes an existing course if the user is authorized.
   * Emits an event and logs relevant actions.
   *
   * @param cmd - DTO containing information required to unpublish a course.
   * @returns Updated CourseDto
   * @throws CourseNotFoundException | UnauthorizedException
   */
  async execute(cmd: UnPublishCourseRequest): Promise<CourseDto> {
    return this.tracer.startActiveSpan(
      `${UnPublishCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, isAdmin, userId } = cmd;

        this.logger.info("Attempting to unpublish course", {
          ctx: UnPublishCourseUseCase.name,
          courseId,
          userId,
        });

        // Early validation
        if (!courseId) {
          const msg = "courseId is required for unpublishing a course";
          this.logger.error(msg, { ctx: UnPublishCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        const course = await this.courseRepository.findById(courseId);

        if (!course) {
          const warnMsg = `Course ${courseId} not found.`;
          this.logger.warn(warnMsg, {
            ctx: UnPublishCourseUseCase.name,
            courseId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new CourseNotFoundException(courseId);
        }

        // Authorization: Allow admins OR instructors of course
        if (!isAdmin && course.getInstructorId() !== userId) {
          const warnMsg = `User ${userId ?? "unknown"} unauthorized to unpublish course ${courseId}.`;
          this.logger.warn(warnMsg, {
            ctx: UnPublishCourseUseCase.name,
            courseId,
            userId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new UnauthorizedException(
            "You are not authorized to unpublish this course"
          );
        }

        try {
          span?.setAttribute("course.id", courseId);

          // Unpublish the course via domain method
          course.unpublishCourse();

          // Persist the changes
          await this.courseRepository.update(course);

          span?.setAttribute("course.unpublished", true);

          // Emit CourseUnPublished event with all relevant fields
          await this.eventProducer.produce<CourseUnPublishedEvent>(
            KafkaTopics.CourseUnpublished,
            {
              key: course.getId(),
              value: {
                eventType: "CourseUnPublishedEvent",
                eventId: uuidV4(),
                timestamp: Date.now(),
                source: "course-service",
                payload: {
                  courseId: course.getId(),
                  instructorId: course.getInstructorId(),
                  slug: course.getSlug(),
                  status: course.getStatus(),
                  title: course.getTitle(),
                  updatedAt: course.getUpdatedAt()?.toISOString?.() || "",
                }
              }
            }
          );

          this.logger.info("Course unpublished successfully.", {
            ctx: UnPublishCourseUseCase.name,
            courseId,
            userId,
            isAdmin,
          });

          return CourseDto.fromDomain(course);
        } catch (error) {
          this.logger.error("Failed to unpublish course", {
            ctx: UnPublishCourseUseCase.name,
            error,
            courseId,
            userId,
            isAdmin,
          });
          throw error;
        }
      }
    );
  }
}
