import { Injectable } from "@nestjs/common";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetLessonsByModuleUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(moduleId: string): Promise<LessonDto[]> {
    return await this.tracer.startActiveSpan(
      "GetLessonsByModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": moduleId,
        });
        this.logger.log(`Fetching lessons with moduleId ${moduleId}`, {
          ctx: GetLessonsByModuleUseCase.name,
        });

        const lessons = await this.lessonRepository.findByModuleId(moduleId);

        span.setAttribute("module.lesson.count", lessons.length);

        this.logger.log(`Lessons ${lessons.length} fetched`, {
          ctx: GetLessonsByModuleUseCase.name,
        });
        return lessons.map(LessonDto.fromDomain);
      },
    );
  }
}
