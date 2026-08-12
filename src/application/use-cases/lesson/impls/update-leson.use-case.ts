import { Injectable } from "@nestjs/common";
import { Lesson } from "@/domain/entities/lesson.entity";
import {
  ContentMetadata,
  ContentType,
} from "src/domain/entities/lesson.entity";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { LessonNotFoundException } from "src/domain/exceptions/lesson.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UpdateLessonDto } from "src/presentation/grpc/dtos/lesson/update-lesson.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IUpdateLessonUseCase } from "../interfaces/update-leson.interface";

@Injectable()
export class UpdateLessonUseCase implements IUpdateLessonUseCase {
  constructor(
    private readonly _lessonRepository: ILessonRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateLessonDto): Promise<Lesson> {
    return await this._tracer.startActiveSpan(
      "UpdateLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": dto.lessonId,
          "lesson.title": dto.title,
        });
        this._logger.debug(`Updating lesson ${dto.lessonId}`, {
          ctx: UpdateLessonUseCase.name,
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

        const lesson = await this._lessonRepository.findById(dto.lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${dto.lessonId} not found`);
        }
        span.setAttribute("lesson.found", true);

        lesson.updateDetails({
          ...dto,
          duration: dto.estimatedDuration,
          contentType: dto.contentType as ContentType,
          metadata: dto.metadata as unknown as ContentMetadata,
        });
        await this._lessonRepository.save(lesson);
        span.setAttribute("db.saved", true);

        this._logger.debug(`Lesson ${dto.lessonId} updated`, {
          ctx: UpdateLessonUseCase.name,
        });
        return lesson
      },
    );
  }
}
