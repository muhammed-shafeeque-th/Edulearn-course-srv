import { Injectable} from "@nestjs/common";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { CourseNotFoundException, LessonNotFoundException, UnauthorizedException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { LessonDeletedEvent } from "src/domain/events/lesson.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DeleteLessonDto } from "src/presentation/grpc/dtos/lesson/delete-lesson.dto";

@Injectable()
export class DeleteLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: DeleteLessonDto): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": dto.lessonId,
        });
        this.logger.log(`Deleting lesson ${dto.lessonId}`, {
          ctx: DeleteLessonUseCase.name,
        });

        const course = await this.courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`
          );
        }

        if(course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException("You are not authorized to perform this operation");
        }

        const lesson = await this.lessonRepository.findById(dto.lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${dto.lessonId} not found`);
        }

        await this.lessonRepository.delete(lesson);

        this.eventEmitter.emit(
          LessonDeletedEvent.name,
          new LessonDeletedEvent(dto.courseId),
        );


        span.setAttribute("lesson.deleted", true);
        this.logger.log(`Lesson ${dto.lessonId} deleted`, {
          ctx: DeleteLessonUseCase.name,
        });
      },
    );
  }
}
