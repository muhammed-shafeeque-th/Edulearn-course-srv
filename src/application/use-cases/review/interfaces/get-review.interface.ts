import { ReviewDto } from "src/application/dtos/review.dto";

export abstract class IGetReviewUseCase {
  abstract execute(reviewId: string): Promise<ReviewDto>;
}
