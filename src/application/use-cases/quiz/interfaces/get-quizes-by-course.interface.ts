import { QuizDto } from "src/application/dtos/quiz.dto";

export abstract class IGetQuizzesByCourseUseCase {
  abstract execute(courseId: string): Promise<QuizDto[]>;
}
