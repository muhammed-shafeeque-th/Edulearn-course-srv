import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LessonNotFoundException } from "src/domain/exceptions/lesson.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { LessonDeletedEvent } from "src/domain/events/lesson.events";
// import { EventEmitter2 } from "@nestjs/event-emitter";
import { DeleteLessonDto } from "src/presentation/grpc/dtos/lesson/delete-lesson.dto";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IDeleteLessonUseCase } from "../interfaces/delete-lesson.interface";

@Injectable()
export class DeleteLessonUseCase implements IDeleteLessonUseCase {
  constructor(
    private readonly _lessonRepository: ILessonRepository,
    private readonly _courseRepository: ICourseRepository,
    // private readonly _eventEmitter: EventEmitter2,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: DeleteLessonDto): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": dto.lessonId,
        });
        this._logger.log(`Deleting lesson ${dto.lessonId}`, {
          ctx: DeleteLessonUseCase.name,
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

        await this._lessonRepository.delete(lesson);

        // this._eventEmitter.emit(
        //   LessonDeletedEvent.name,
        //   new LessonDeletedEvent(dto.courseId),
        // );

        span.setAttribute("lesson.deleted", true);
        this._logger.log(`Lesson ${dto.lessonId} deleted`, {
          ctx: DeleteLessonUseCase.name,
        });
      },
    );
  }
}
