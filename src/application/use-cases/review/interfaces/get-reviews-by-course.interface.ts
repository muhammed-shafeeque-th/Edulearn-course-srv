import { ReviewDto } from "src/application/dtos/review.dto";

export abstract class IGetReviewsByCourseUseCase {
  abstract execute(
    courseId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    minRating?: number,
  ): Promise<{ reviews: ReviewDto[]; total: number }>;
}
