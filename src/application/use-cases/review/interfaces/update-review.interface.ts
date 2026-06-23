import { ReviewDto } from "src/application/dtos/review.dto";
import { UpdateReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IUpdateReviewUseCase {
  abstract execute(dto: UpdateReviewRequest): Promise<ReviewDto>;
}
