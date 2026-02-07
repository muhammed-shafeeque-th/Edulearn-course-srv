import { Injectable} from "@nestjs/common";
import { LessonDto } from "src/application/dtos/lesson.dto";
import {
  ContentMetadata,
  ContentType,
} from "src/domain/entities/lesson.entity";
import { CourseNotFoundException, LessonNotFoundException, UnauthorizedException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { UpdateLessonDto } from "src/presentation/grpc/dtos/lesson/update-lesson.dto";

@Injectable()
export class UpdateLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(dto: UpdateLessonDto): Promise<LessonDto> {
    return await this.tracer.startActiveSpan(
      "UpdateLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": dto.lessonId,
          "lesson.title": dto.title,
        });
        this.logger.log(`Updating lesson ${dto.lessonId}`, {
          ctx: UpdateLessonUseCase.name,
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
        span.setAttribute("lesson.found", true);

        lesson.updateDetails({
          ...dto,
          duration: dto.estimatedDuration,
          contentType: dto.contentType as ContentType,
          metadata: dto.metadata as unknown as ContentMetadata,
        });
        await this.lessonRepository.save(lesson);
        span.setAttribute("db.saved", true);

        this.logger.log(`Lesson ${dto.lessonId} updated`, {
          ctx: UpdateLessonUseCase.name,
        });
        return LessonDto.fromDomain(lesson);
      }
    );
  }
}
