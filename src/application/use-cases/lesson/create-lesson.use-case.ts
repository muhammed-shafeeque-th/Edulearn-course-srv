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
} from "src/domain/exceptions/course.exceptions";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CreateLessonDto } from "src/presentation/grpc/dtos/lesson/create-lesson.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { v4 as uuidV4 } from "uuid";

@Injectable()
export class CreateLessonUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly lessonRepository: ILessonRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    dto: CreateLessonDto,
    idempotencyKey: string,
  ): Promise<LessonDto> {
    return await this.tracer.startActiveSpan(
      "CreateLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": dto.moduleId,
          "lesson.title": dto.title,
        });

        // Check for existing course by idempotency key
        const existingLesson =
          await this.lessonRepository.findByIdempotencyKey(idempotencyKey);
        if (existingLesson) {
          span.setAttribute("idempotency.duplicate", true);
          this.logger.debug(
            `Lesson creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateLessonUseCase.name}`,
          );
          return LessonDto.fromDomain(existingLesson);
        }

        this.logger.log(`Creating lesson for module ${dto.moduleId}`, {
          ctx: CreateLessonUseCase.name,
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
            "You are not authorized to perform this operation",
          );
        }

        const module = await this.moduleRepository.findById(dto.moduleId);
        if (!module) {
          span.setAttribute("module.found", false);
          throw new ModuleNotFoundException(`Module ${dto.moduleId} not found`);
        }
        span.setAttribute("module.found", true);
        const lessonId = uuidV4();
        const lesson = new Lesson({
          id: lessonId,
          moduleId: dto.moduleId,
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
          new LessonCreatedEvent(dto.courseId),
        );

        this.logger.log(`Lesson created for module ${dto.moduleId}`, {
          ctx: CreateLessonUseCase.name,
        });
        return LessonDto.fromDomain(lesson);
      },
    );
  }
}
