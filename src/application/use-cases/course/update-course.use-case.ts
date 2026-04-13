import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { CourseDto } from "../../dtos/course.dto";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import {
  CourseAlreadyExistException,
  CourseNotFoundException,
} from "src/domain/exceptions/course.exceptions";
import { UpdateCourseRequestDto } from "src/presentation/grpc/dtos/course/update-course-request.dto";
import slugify from "slugify";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { KafkaTopics } from "src/shared/events/event.topics";
import { v4 as uuidV4 } from "uuid";
import { CourseStatus } from "src/domain/entities/course.entity";
import { CourseUpdatedEvent } from "src/domain/events/course-lifecycle.events";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly publishService: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: UpdateCourseRequestDto): Promise<CourseDto> {
    return await this.tracer.startActiveSpan(
      "UpdateCourseUseCase.execute",
      async (span) => {
        this.logger.debug(`Updating course ${dto.courseId}`, {
          ctx: UpdateCourseUseCase.name,
        });
        span.setAttributes({
          "course.id": dto.courseId,
          "course.title": dto.title,
        });

        const course = await this.courseRepository.findById(dto.courseId);
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
          const slugExist = await this.courseRepository.findBySlug(slug);
          if (slugExist) {
            throw new CourseAlreadyExistException(slugExist.getTitle());
          }
        }

        course.updateDetails({ ...dto, courseLanguage: dto.language });
        course.updateSlug(slug);

        await this.courseRepository.update(course);

        await this.publishService.produce<CourseUpdatedEvent>(
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

        this.logger.log(`Course ${dto.courseId} updated`, {
          ctx: UpdateCourseUseCase.name,
        });
        return CourseDto.fromDomain(course);
      },
    );
  }
}
