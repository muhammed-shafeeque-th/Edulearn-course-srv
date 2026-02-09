import { Injectable } from "@nestjs/common";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { LessonNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(lessonId: string): Promise<LessonDto> {
    return await this.tracer.startActiveSpan(
      "GetLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": lessonId,
        });
        this.logger.log(`Fetching lesson ${lessonId}`, {
          ctx: GetLessonUseCase.name,
        });

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", true);

        this.logger.log(`Lesson ${lessonId} fetched`, {
          ctx: GetLessonUseCase.name,
        });
        return LessonDto.fromDomain(lesson);
      },
    );
  }
}
