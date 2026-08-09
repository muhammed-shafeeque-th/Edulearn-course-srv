import { Injectable } from "@nestjs/common";
import { Lesson } from "@/domain/entities/lesson.entity";
import { LessonNotFoundException } from "src/domain/exceptions/lesson.exceptions";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetLessonUseCase } from "../interfaces/get-lesson.interface";

@Injectable()
export class GetLessonUseCase implements IGetLessonUseCase {
  constructor(
    private readonly _lessonRepository: ILessonRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(lessonId: string): Promise<Lesson> {
    return await this._tracer.startActiveSpan(
      "GetLessonUseCase.execute",
      async (span) => {
        span.setAttributes({
          "lesson.id": lessonId,
        });
        this._logger.log(`Fetching lesson ${lessonId}`, {
          ctx: GetLessonUseCase.name,
        });

        const lesson = await this._lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", true);

        this._logger.log(`Lesson ${lessonId} fetched`, {
          ctx: GetLessonUseCase.name,
        });
        return lesson
      },
    );
  }
}
