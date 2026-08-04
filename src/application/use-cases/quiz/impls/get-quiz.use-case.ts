import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { QuizNotFoundException } from "src/domain/exceptions/quiz.exceptions";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetQuizUseCase } from "../interfaces/get-quiz.interface";

@Injectable()
export class GetQuizUseCase implements IGetQuizUseCase {
  constructor(
    private readonly _quizRepository: IQuizRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(quizId: string): Promise<QuizDto> {
    return await this._tracer.startActiveSpan(
      "GetQuizUseCase.execute",
      async (span) => {
        span.setAttributes({
          "quiz.id": quizId,
        });
        this._logger.log(`Fetching quiz ${quizId}`, {
          ctx: GetQuizUseCase.name,
        });

        const quiz = await this._quizRepository.findById(quizId);
        if (!quiz) {
          span.setAttribute("quiz.found", false);
          throw new QuizNotFoundException(`Quiz ${quizId} not found`);
        }
        span.setAttribute("quiz.found", true);

        this._logger.log(`Quiz ${quizId} fetched`, {
          ctx: GetQuizUseCase.name,
        });
        return QuizDto.fromDomain(quiz);
      },
    );
  }
}
