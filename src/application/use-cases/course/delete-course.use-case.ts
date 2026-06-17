import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import {
  CourseNotFoundException,
} from "src/domain/exceptions/course.exceptions";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { v4 as uuidV4 } from "uuid";
import { KafkaTopics } from "src/shared/events/event.topics";
import { DeleteCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CourseDeletedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";

/**
 * Use case responsible for deleting a course.
 * Supports tracing, logging, authorization, and emits domain events.
 */
@Injectable()
export class DeleteCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly eventProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Soft deletes a course. Only admins or owner instructors are authorized.
   * Emits CourseDeletedEvent on success.
   * @param cmd - DeleteCourseRequest containing courseId, userId, isAdmin.
   * @throws CourseNotFoundException | UnauthorizedException
   */
  async execute(cmd: DeleteCourseRequest): Promise<void> {
    return await this.tracer.startActiveSpan(
      `${DeleteCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, userId, isAdmin } = cmd;

        this.logger.debug("Attempting to delete course", {
          ctx: DeleteCourseUseCase.name,
          courseId,
          userId,
        });

        // Input validation - courseId is required.
        if (!courseId) {
          const msg = "courseId is required for deleting a course";
          this.logger.error(msg, { ctx: DeleteCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        // Find the course by ID.
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
          const msg = `Course ${courseId} not found.`;
          this.logger.warn(msg, { ctx: DeleteCourseUseCase.name, courseId });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException(courseId);
        }

        // Authorization: only admins or owner instructor can delete.
        if (!isAdmin && course.getInstructorId() !== userId) {
          const msg = `User ${userId ?? "unknown"} unauthorized to delete course ${courseId}.`;
          this.logger.warn(msg, {
            ctx: DeleteCourseUseCase.name,
            courseId,
            userId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new UnauthorizedException(
            "You are not authorized to delete this course",
          );
        }

        try {
          span?.setAttribute("course.id", courseId);

          // perform soft delete on domain entity.
          course.softDelete();

          // persist the change using the repository.
          await this.courseRepository.delete(course);

          span?.setAttribute("course.deleted", true);

          // Emit event to signal that a course was deleted.
          await this.eventProducer.produce<CourseDeletedEvent>(
            KafkaTopics.CourseDeleted,
            {
              key: course.getId(),
              value: {
                eventId: uuidV4(),
                timestamp: Date.now(),
                eventType: "CourseDeletedEvent",
                source: "course-service",
                payload: {
                  courseId: course.getId(),
                  instructorId: course.getInstructorId(),
                  slug: course.getSlug(),
                  status: course.getStatus(),
                  title: course.getTitle(),
                  updatedAt: course.getUpdatedAt()?.toISOString() || "",
                },
              },
            },
          );

          this.logger.debug("Course deleted successfully.", {
            ctx: DeleteCourseUseCase.name,
            courseId,
            userId,
          });
        } catch (error) {
          const errorMsg = `Error while deleting course: ${error.message}`;
          this.logger.error(errorMsg, { error, ctx: DeleteCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", errorMsg);
          throw error;
        }
      },
    );
  }
}
