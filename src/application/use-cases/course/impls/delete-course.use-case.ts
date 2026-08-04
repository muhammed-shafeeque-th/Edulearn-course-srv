import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { v4 as uuidV4 } from "uuid";
import { KafkaTopics } from "src/shared/events/event.topics";
import { DeleteCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CourseDeletedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IDeleteCourseUseCase } from "../interfaces/delete-course.interface";

@Injectable()
export class DeleteCourseUseCase implements IDeleteCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _eventProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(cmd: DeleteCourseRequest): Promise<void> {
    return await this._tracer.startActiveSpan(
      `${DeleteCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, userId, isAdmin } = cmd;

        this._logger.debug("Attempting to delete course", {
          ctx: DeleteCourseUseCase.name,
          courseId,
          userId,
        });

        // Input validation - courseId is required.
        if (!courseId) {
          const msg = "courseId is required for deleting a course";
          this._logger.error(msg, { ctx: DeleteCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        // Find the course by ID.
        const course = await this._courseRepository.findById(courseId);
        if (!course) {
          const msg = `Course ${courseId} not found.`;
          this._logger.warn(msg, { ctx: DeleteCourseUseCase.name, courseId });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException(courseId);
        }

        // Authorization: only admins or owner instructor can delete.
        if (!isAdmin && course.getInstructorId() !== userId) {
          const msg = `User ${userId ?? "unknown"} unauthorized to delete course ${courseId}.`;
          this._logger.warn(msg, {
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
          await this._courseRepository.delete(course);

          span?.setAttribute("course.deleted", true);

          // Emit event to signal that a course was deleted.
          await this._eventProducer.produce<CourseDeletedEvent>(
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

          this._logger.debug("Course deleted successfully.", {
            ctx: DeleteCourseUseCase.name,
            courseId,
            userId,
          });
        } catch (error: any) {
          const errorMsg = `Error while deleting course: ${error.message}`;
          this._logger.error(errorMsg, {
            error,
            ctx: DeleteCourseUseCase.name,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", errorMsg);
          throw error;
        }
      },
    );
  }
}
