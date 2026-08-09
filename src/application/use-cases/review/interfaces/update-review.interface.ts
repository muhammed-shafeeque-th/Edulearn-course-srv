import { Review } from "src/domain/entities/review.entity";
import { UpdateReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IUpdateReviewUseCase {
  abstract execute(dto: UpdateReviewRequest): Promise<Review>;
}
