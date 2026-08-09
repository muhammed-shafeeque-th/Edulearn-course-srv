import { Review } from "src/domain/entities/review.entity";

export abstract class IGetReviewsByCourseUseCase {
  abstract execute(
    courseId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    minRating?: number,
  ): Promise<{ reviews: Review[]; total: number }>;
}
