import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { QuizNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetQuizUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(quizId: string): Promise<QuizDto> {
    return await this.tracer.startActiveSpan(
      "GetQuizUseCase.execute",
      async (span) => {
        span.setAttributes({
          "quiz.id": quizId,
        });
        this.logger.log(`Fetching quiz ${quizId}`, {
          ctx: GetQuizUseCase.name,
        });

        const quiz = await this.quizRepository.findById(quizId);
        if (!quiz) {
          span.setAttribute("quiz.found", false);
          throw new QuizNotFoundException(`Quiz ${quizId} not found`);
        }
        span.setAttribute("quiz.found", true);

        this.logger.log(`Quiz ${quizId} fetched`, { ctx: GetQuizUseCase.name });
        return QuizDto.fromDomain(quiz);
      },
    );
  }
}
