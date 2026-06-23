import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { KafkaTopics } from "src/shared/events/event.topics";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { v4 as uuidV4 } from "uuid";
import { CourseDto } from "src/application/dtos/course.dto";
import { UnPublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CourseUnPublishedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IUnPublishCourseUseCase } from "../interfaces/unpublish-course.interface";

@Injectable()
export class UnPublishCourseUseCase implements IUnPublishCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _eventProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(cmd: UnPublishCourseRequest): Promise<CourseDto> {
    return this._tracer.startActiveSpan(
      `${UnPublishCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, isAdmin, userId } = cmd;

         this._logger.debug("Attempting to unpublish course", {
          ctx: UnPublishCourseUseCase.name,
          courseId,
          userId,
        });

        // Early validation
        if (!courseId) {
          const msg = "courseId is required for unpublishing a course";
           this._logger.error(msg, { ctx: UnPublishCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        const course = await this._courseRepository.findById(courseId);

        if (!course) {
          const warnMsg = `Course ${courseId} not found.`;
           this._logger.warn(warnMsg, {
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
           this._logger.warn(warnMsg, {
            ctx: UnPublishCourseUseCase.name,
            courseId,
            userId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new UnauthorizedException(
            "You are not authorized to unpublish this course",
          );
        }

        try {
          span?.setAttribute("course.id", courseId);

          // Unpublish the course via domain method
          course.unpublishCourse();

          // Persist the changes
          await this._courseRepository.update(course);

          span?.setAttribute("course.unpublished", true);

          // Emit CourseUnPublished event with all relevant fields
          await this._eventProducer.produce<CourseUnPublishedEvent>(
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
                },
              },
            },
          );

           this._logger.debug("Course unpublished successfully.", {
            ctx: UnPublishCourseUseCase.name,
            courseId,
            userId,
            isAdmin,
          });

          return CourseDto.fromDomain(course);
        } catch (error) {
           this._logger.error("Failed to unpublish course", {
            ctx: UnPublishCourseUseCase.name,
            error,
            courseId,
            userId,
            isAdmin,
          });
          throw error;
        }
      },
    );
  }
}
