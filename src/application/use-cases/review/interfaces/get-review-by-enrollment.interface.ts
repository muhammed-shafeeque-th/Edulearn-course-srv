import { ReviewDto } from "src/application/dtos/review.dto";
import { GetReviewByEnrollmentRequest } from "src/infrastructure/grpc/generated/course/types/review";

export abstract class IGetReviewByEnrollmentUseCase {
  abstract execute(dto: GetReviewByEnrollmentRequest): Promise<ReviewDto>;
}
