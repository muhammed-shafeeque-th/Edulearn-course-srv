import { Injectable } from "@nestjs/common";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetLessonsByModuleUseCase } from "../interfaces/get-lessons-by-modules.interface";

@Injectable()
export class GetLessonsByModuleUseCase implements IGetLessonsByModuleUseCase {
  constructor(
    private readonly _lessonRepository: ILessonRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(moduleId: string): Promise<LessonDto[]> {
    return await this._tracer.startActiveSpan(
      "GetLessonsByModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": moduleId,
        });
        this._logger.log(`Fetching lessons with moduleId ${moduleId}`, {
          ctx: GetLessonsByModuleUseCase.name,
        });

        const lessons = await this._lessonRepository.findByModuleId(moduleId);

        span.setAttribute("module.lesson.count", lessons.length);

        this._logger.log(`Lessons ${lessons.length} fetched`, {
          ctx: GetLessonsByModuleUseCase.name,
        });
        return lessons.map(LessonDto.fromDomain);
      },
    );
  }
}
