import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { CourseDto } from "../../../dtos/course.dto";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { Course } from "src/domain/entities/course.entity";
import { v4 as uuidV4 } from "uuid";
import { CourseAlreadyExistException } from "src/domain/exceptions/course.exceptions";
import { CreateCourseRequestDto } from "src/presentation/grpc/dtos/course/create-course.dto";
import slugify from "slugify";
import { User } from "src/domain/entities/user.entity";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { KafkaTopics } from "src/shared/events/event.topics";
import { CourseCreatedEvent } from "src/domain/events/course-lifecycle.events";
import { ICreateCourseUseCase } from "../interfaces/create-course.interface";

@Injectable()
export class CreateCourseUseCase implements ICreateCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _publishService: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    payload: CreateCourseRequestDto,
    idempotencyKey: string,
  ): Promise<CourseDto> {
    return await this._tracer.startActiveSpan(
      "CreateCourseUseCase.execute",
      async (span) => {
        this._logger.debug(
          `Creating course: ${payload.title} in ${CreateCourseUseCase.name}`,
        );

        // Check for existing course by idempotency key
        const existingCourse =
          await this._courseRepository.findByIdempotencyKey(idempotencyKey);
        if (existingCourse) {
          span.setAttribute("idempotency.duplicate", true);
          this._logger.debug(
            `Course creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateCourseUseCase.name}`,
          );
          return CourseDto.fromDomain(existingCourse);
        }
        span.setAttribute("idempotency.duplicate", false);

        const slug = slugify(payload.title, { lower: true, strict: true });

        const slugExist = await this._courseRepository.findBySlug(slug);
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

        await this._courseRepository.save(course);

        await this._publishService.produce<CourseCreatedEvent>(
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

        this._logger.debug(
          `Course created with ID: ${course.getId()} in ${CreateCourseUseCase.name}`,
        );
        return CourseDto.fromDomain(course);
      },
    );
  }
}
