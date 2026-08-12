import { Injectable } from "@nestjs/common";
import { Quiz } from "@/domain/entities/quiz.entity";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetQuizzesByCourseUseCase } from "../interfaces/get-quizes-by-course.interface";

@Injectable()
export class GetQuizzesByCourseUseCase implements IGetQuizzesByCourseUseCase {
  constructor(
    private readonly _quizRepository: IQuizRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(courseId: string): Promise<Quiz[]> {
    return await this._tracer.startActiveSpan(
      "GetQuizzesByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this._logger.debug(`Fetching quizzes for course ${courseId}`, {
          ctx: GetQuizzesByCourseUseCase.name,
        });

        const quizzes = await this._quizRepository.findByCourseId(courseId);

        span.setAttribute("db.quizzes.count", quizzes.length);

        this._logger.debug(`Quiz fetched for courseId ${courseId} `, {
          ctx: GetQuizzesByCourseUseCase.name,
        });
        return quizzes;
      },
    );
  }
}
