import { QuizDto } from "src/application/dtos/quiz.dto";

export abstract class IGetQuizUseCase {
  abstract execute(quizId: string): Promise<QuizDto>;
}
