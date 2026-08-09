import { Review } from "src/domain/entities/review.entity";

export abstract class IGetReviewUseCase {
  abstract execute(reviewId: string): Promise<Review>;
}
