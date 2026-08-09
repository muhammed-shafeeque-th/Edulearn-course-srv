import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { KafkaTopics } from "src/shared/events/event.topics";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { v4 as uuidV4 } from "uuid";
import { Course } from "@/domain/entities/course.entity";
import { PublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";
import { CoursePublishedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IPublishCourseUseCase } from "../interfaces/publish-course.interface";

@Injectable()
export class PublishCourseUseCase implements IPublishCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _eventProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(cmd: PublishCourseRequest): Promise<Course> {
    return this._tracer.startActiveSpan(
      `${PublishCourseUseCase.name}.execute`,
      async (span) => {
        const { courseId, userId, isAdmin } = cmd;

        this._logger.debug("Attempting to publish course", {
          ctx: PublishCourseUseCase.name,
          courseId,
          userId,
        });

        // Validation: courseId must exist
        if (!courseId) {
          const msg = "courseId is required for publishing a course";
          this._logger.error(msg, { ctx: PublishCourseUseCase.name });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", msg);
          throw new CourseNotFoundException("courseId is missing");
        }

        // Find course
        const course = await this._courseRepository.findById(courseId);

        if (!course) {
          const warnMsg = `Course ${courseId} not found.`;
          this._logger.warn(warnMsg, {
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
          this._logger.warn(warnMsg, {
            ctx: PublishCourseUseCase.name,
            courseId,
            userId,
          });
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", warnMsg);
          throw new UnauthorizedException(
            "You are not authorized to publish this course",
          );
        }

        span?.setAttribute("course.id", courseId);

        // Publish the course via domain method
        course.publishCourse();

        // Save
        await this._courseRepository.update(course);

        span?.setAttribute("course.published", true);

        // Emit event after publishing
        await this._eventProducer.produce<CoursePublishedEvent>(
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
              },
            },
          },
        );

        this._logger.debug("Course published successfully.", {
          ctx: PublishCourseUseCase.name,
          courseId,
          userId,
        });

        return course;
      },
    );
  }
}
