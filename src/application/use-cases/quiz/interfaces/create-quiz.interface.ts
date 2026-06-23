import { QuizDto } from "src/application/dtos/quiz.dto";
import { CreateQuizDto } from "src/presentation/grpc/dtos/quiz/create-quiz.dto";

export abstract class ICreateQuizUseCase {
  /**
   * Creates a quiz for a course module.
   * @param dto CreateQuizDto - The quiz data transfer object
   * @param idempotencyKey string - Key for idempotency and deduplication
   * @returns Promise<QuizDto>
   */
  abstract execute(
    dto: CreateQuizDto,
    idempotencyKey: string,
  ): Promise<QuizDto>;
}
