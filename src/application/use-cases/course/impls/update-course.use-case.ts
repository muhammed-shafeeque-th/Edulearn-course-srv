import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { Course } from "@/domain/entities/course.entity";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import {
  CourseAlreadyExistException,
  CourseNotFoundException,
} from "src/domain/exceptions/course.exceptions";
import { UpdateCourseRequestDto } from "src/presentation/grpc/dtos/course/update-course-request.dto";
import slugify from "slugify";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { KafkaTopics } from "src/shared/events/event.topics";
import { v4 as uuidV4 } from "uuid";
import { CourseStatus } from "src/domain/entities/course.entity";
import { CourseUpdatedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IUpdateCourseUseCase } from "../interfaces/update-course.interface";

@Injectable()
export class UpdateCourseUseCase implements IUpdateCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _publishService: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateCourseRequestDto): Promise<Course> {
    return await this._tracer.startActiveSpan(
      "UpdateCourseUseCase.execute",
      async (span) => {
        this._logger.debug(`Updating course ${dto.courseId}`, {
          ctx: UpdateCourseUseCase.name,
        });
        span.setAttributes({
          "course.id": dto.courseId,
          "course.title": dto.title,
        });

        const course = await this._courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`,
          );
        }
        if (course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException(
            "You are not authorized to update this course",
          );
        }

        span.setAttribute("course.found", true);

        const slug = slugify(dto.title, { lower: true, strict: true });
        if (course.getSlug() !== slug) {
          const slugExist = await this._courseRepository.findBySlug(slug);
          if (slugExist) {
            throw new CourseAlreadyExistException(slugExist.getTitle());
          }
        }

        course.updateDetails({ ...dto, courseLanguage: dto.language });
        course.updateSlug(slug);

        await this._courseRepository.update(course);

        await this._publishService.produce<CourseUpdatedEvent>(
          KafkaTopics.CourseUpdated,
          {
            key: course.getId(),
            value: {
              eventId: uuidV4(),
              eventType: "CourseUpdatedEvent",
              timestamp: Date.now(),
              source: "course-service",
              payload: {
                courseId: course.getId(),
                title: course.getTitle(),
                slug: course.getSlug(),
                instructorId: course.getInstructorId(),
                status: course.getStatus(),
                updatedAt: course.getCreatedAt().toISOString(),
              },
            },
          },
        );

        span.setAttribute("course.updated", true);

        this._logger.debug(`Course ${dto.courseId} updated`, {
          ctx: UpdateCourseUseCase.name,
        });
        return course;
      },
    );
  }
}
