import { Review } from "src/domain/entities/review.entity";
import { GetReviewByEnrollmentRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IGetReviewByEnrollmentUseCase {
  abstract execute(dto: GetReviewByEnrollmentRequest): Promise<Review>;
}
