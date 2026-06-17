import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { CourseDto } from "../../dtos/course.dto";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Course } from "src/domain/entities/course.entity";
import { v4 as uuidV4 } from "uuid";
import { CourseAlreadyExistException } from "src/domain/exceptions/course.exceptions";
import { CreateCourseRequestDto } from "src/presentation/grpc/dtos/course/create-course.dto";
import slugify from "slugify";
import { User } from "src/domain/entities/user.entity";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { KafkaTopics } from "src/shared/events/event.topics";
import { CourseCreatedEvent } from "src/domain/events/course-lifecycle.events";

@Injectable()
export class CreateCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly publishService: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    payload: CreateCourseRequestDto,
    idempotencyKey: string,
  ): Promise<CourseDto> {
    return await this.tracer.startActiveSpan(
      "CreateCourseUseCase.execute",
      async (span) => {
        this.logger.debug(
          `Creating course: ${payload.title} in ${CreateCourseUseCase.name}`,
        );

        // Check for existing course by idempotency key
        const existingCourse =
          await this.courseRepository.findByIdempotencyKey(idempotencyKey);
        if (existingCourse) {
          span.setAttribute("idempotency.duplicate", true);
          this.logger.debug(
            `Course creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateCourseUseCase.name}`,
          );
          return CourseDto.fromDomain(existingCourse);
        }
        span.setAttribute("idempotency.duplicate", false);

        const slug = slugify(payload.title, { lower: true, strict: true });

        const slugExist = await this.courseRepository.findBySlug(slug);
        if (slugExist) {
          span.setAttribute("course.title.already_exist", true);
          throw new CourseAlreadyExistException(slugExist.getTitle());
        }

        span.setAttribute("course.title.already_exist", false);

        const instructor = new User(
          payload.instructor.id,
          payload.instructor.name,
          payload.instructor.avatar,
          payload.instructor.email,
        );

        const courseId = uuidV4();

        const course = new Course({
          id: courseId,
          instructor: instructor,
          instructorId: payload.instructorId,
          idempotencyKey: idempotencyKey,
          details: {
            title: payload.title,
            slug: slug,
            subTitle: payload.subTitle,
            category: payload.category,
            subCategory: payload.subCategory,
            courseLanguage: payload.language,
            subtitleLanguage: payload.subtitleLanguage,
            level: payload.level,
            topics: payload.topics,
            duration: parseInt(payload.durationValue),
            durationUnit: payload.durationUnit,
          },
        });

        await this.courseRepository.save(course);

        await this.publishService.produce<CourseCreatedEvent>(
          KafkaTopics.CourseCreated,
          {
            key: course.getId(),
            value: {
              eventId: uuidV4(),
              timestamp: Date.now(),
              eventType: "CourseCreatedEvent",
              source: "course-service",
              payload: {
                courseId,
                title: course.getTitle(),
                slug: course.getSlug(),
                instructorId: course.getInstructorId(),
                status: course.getStatus(),
                createdAt: course.getCreatedAt().toISOString(),
              },
            },
          },
        );

        this.logger.debug(
          `Course created with ID: ${course.getId()} in ${CreateCourseUseCase.name}`,
        );
        return CourseDto.fromDomain(course);
      },
    );
  }
}
