import { Quiz } from "@/domain/entities/quiz.entity";

export abstract class IGetQuizUseCase {
  abstract execute(quizId: string): Promise<Quiz>;
}
