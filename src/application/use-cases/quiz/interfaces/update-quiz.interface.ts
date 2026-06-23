import { QuizDto } from "src/application/dtos/quiz.dto";
import { UpdateQuizDto } from "src/presentation/grpc/dtos/quiz/update-quiz.dto";

export abstract class IUpdateQuizUseCase {
  /**
   * Updates a quiz entity.
   *
   * @param dto UpdateQuizDto - Data Transfer Object containing update info
   * @returns Promise<QuizDto> - The updated quiz
   * @throws CourseNotFoundException, QuizNotFoundException, UnauthorizedException
   */
  abstract execute(dto: UpdateQuizDto): Promise<QuizDto>;
}
