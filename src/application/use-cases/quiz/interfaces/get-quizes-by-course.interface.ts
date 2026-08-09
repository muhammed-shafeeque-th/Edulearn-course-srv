import { Quiz } from "@/domain/entities/quiz.entity";

export abstract class IGetQuizzesByCourseUseCase {
  abstract execute(courseId: string): Promise<Quiz[]>;
}
