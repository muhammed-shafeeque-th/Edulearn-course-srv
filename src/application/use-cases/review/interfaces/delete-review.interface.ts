import { DeleteReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IDeleteReviewUseCase {
  abstract execute(dto: DeleteReviewRequest): Promise<void>;
}
