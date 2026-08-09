import { Review } from "src/domain/entities/review.entity";
import { SubmitCourseReviewRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IAddReviewUseCase {
  abstract execute(dto: SubmitCourseReviewRequest): Promise<Review>;
}
