import { Injectable } from "@nestjs/common";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetLessonsBySectionUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(sectionId: string): Promise<LessonDto[]> {
    return await this.tracer.startActiveSpan(
      "GetLessonsBySectionUseCase.execute",
      async (span) => {
        span.setAttributes({
          "section.id": sectionId,
        });
        this.logger.log(`Fetching lessons with sectionId ${sectionId}`, {
          ctx: GetLessonsBySectionUseCase.name,
        });

        const lessons = await this.lessonRepository.findBySectionId(sectionId);

        span.setAttribute("section.lesson.count", lessons.length);

        this.logger.log(`Lessons ${lessons.length} fetched`, {
          ctx: GetLessonsBySectionUseCase.name,
        });
        return lessons.map(LessonDto.fromDomain);
      },
    );
  }
}
