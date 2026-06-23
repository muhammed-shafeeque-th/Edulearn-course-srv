import { DeleteQuizDto } from "src/presentation/grpc/dtos/quiz/delete-quiz.dto";

export abstract class IDeleteQuizUseCase {
  abstract execute(dto: DeleteQuizDto): Promise<void>;
}
