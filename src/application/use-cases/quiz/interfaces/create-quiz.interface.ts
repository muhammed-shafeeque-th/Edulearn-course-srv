import { Quiz } from "@/domain/entities/quiz.entity";
import { CreateQuizDto } from "src/presentation/grpc/dtos/quiz/create-quiz.dto";

export abstract class ICreateQuizUseCase {
  /**
   * Creates a quiz for a course module.
   * @param dto CreateQuizDto - The quiz data transfer object
   * @param idempotencyKey string - Key for idempotency and deduplication
   * @returns Promise<Quiz>
   */
  abstract execute(
    dto: CreateQuizDto,
    idempotencyKey: string,
  ): Promise<Quiz>;
}
