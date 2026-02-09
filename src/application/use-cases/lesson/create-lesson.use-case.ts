import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { LessonDto } from "src/application/dtos/lesson.dto";
import {
  ContentMetadata,
  ContentType,
  Lesson,
} from "src/domain/entities/lesson.entity";
import { LessonCreatedEvent } from "src/domain/events/lesson.events";
import {
  CourseNotFoundException,
  SectionNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { ISectionRepository } from "src/domain/repositories/section.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CreateLessonDto } from "src/presentation/grpc/dtos/lesson/create-lesson.dto";
import { v4 as uuidV4 } from "uuid";

@Injectable()
export class CreateLessonUseCase {
  constructor(
    private readonly sectionRepository: ISectionRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly lessonRepository: ILessonRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    dto: CreateLessonDto,
    idempotencyKey: string
  ): Promise<LessonDto> {
    return await this.tracer.startActiveSpan(
      "CreateLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "section.id": dto.sectionId,
          "lesson.title": dto.title,
        });

        // Check for existing course by idempotency key
        const existingLesson =
          await this.lessonRepository.findByIdempotencyKey(idempotencyKey);
        if (existingLesson) {
          span.setAttribute("idempotency.duplicate", true);
          this.logger.info(
            `Lesson creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateLessonUseCase.name}`
          );
          return LessonDto.fromDomain(existingLesson);
        }

        this.logger.log(`Creating lesson for section ${dto.sectionId}`, {
          ctx: CreateLessonUseCase.name,
        });
        const course = await this.courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`
          );
        }

        if (course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException(
            "You are not authorized to perform this operation"
          );
        }

        const section = await this.sectionRepository.findById(dto.sectionId);
        if (!section) {
          span.setAttribute("section.found", false);
          throw new SectionNotFoundException(
            `Section ${dto.sectionId} not found`
          );
        }
        span.setAttribute("section.found", true);
        const lessonId = uuidV4();
        const lesson = new Lesson({
          id: lessonId,
          sectionId: dto.sectionId,
          title: dto.title,
          description: dto.description,
          idempotencyKey: idempotencyKey,
          contentType: dto.contentType as ContentType,
          contentUrl: dto.contentUrl,
          order: dto.order,
          metadata: dto.metadata as unknown as ContentMetadata,
          isPreview: dto.isPreview,
          isPublished: dto.isPublished,
          duration: dto.estimatedDuration,
        });
        
        await this.lessonRepository.save(lesson);
        span.setAttribute("lesson.saved", true);

        // Emit application event AFTER persistence succeeds
        this.eventEmitter.emit(
          LessonCreatedEvent.name,
          new LessonCreatedEvent(dto.courseId)
        );

        this.logger.log(`Lesson created for section ${dto.sectionId}`, {
          ctx: CreateLessonUseCase.name,
        });
        return LessonDto.fromDomain(lesson);
      }
    );
  }
}
