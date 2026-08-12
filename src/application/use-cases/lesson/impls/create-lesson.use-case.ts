import { Injectable } from "@nestjs/common";
import {
  ContentMetadata,
  ContentType,
  Lesson,
} from "src/domain/entities/lesson.entity";
import { LessonCreatedEvent } from "src/domain/events/lesson.events";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CreateLessonDto } from "src/presentation/grpc/dtos/lesson/create-lesson.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { v4 as uuidV4 } from "uuid";
import { ICreateLessonUseCase } from "../interfaces/create-lesson.interface";

@Injectable()
export class CreateLessonUseCase implements ICreateLessonUseCase {
  constructor(
    private readonly _moduleRepository: IModuleRepository,
    private readonly _courseRepository: ICourseRepository,
    // private readonly _eventEmitter: EventEmitter2,
    private readonly _lessonRepository: ILessonRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: CreateLessonDto,
    idempotencyKey: string,
  ): Promise<Lesson> {
    return await this._tracer.startActiveSpan(
      "CreateLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": dto.moduleId,
          "lesson.title": dto.title,
        });

        // Check for existing course by idempotency key
        const existingLesson =
          await this._lessonRepository.findByIdempotencyKey(idempotencyKey);
        if (existingLesson) {
          span.setAttribute("idempotency.duplicate", true);
          this._logger.debug(
            `Lesson creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateLessonUseCase.name}`,
          );
          return existingLesson;
        }

        this._logger.debug(`Creating lesson for module ${dto.moduleId}`, {
          ctx: CreateLessonUseCase.name,
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
            "You are not authorized to perform this operation",
          );
        }

        const module = await this._moduleRepository.findById(dto.moduleId);
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

        await this._lessonRepository.save(lesson);
        span.setAttribute("lesson.saved", true);

        // Emit application event AFTER persistence succeeds
        // this._eventEmitter.emit(
        //   LessonCreatedEvent.name,
        //   new LessonCreatedEvent(dto.courseId),
        // );

        this._logger.debug(`Lesson created for module ${dto.moduleId}`, {
          ctx: CreateLessonUseCase.name,
        });
        return lesson
      },
    );
  }
}
