import { Review } from "../entities/review.entity";
import { IBaseRepository } from "./base.repository";

export interface ReviewBreakDown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export abstract class IReviewRepository extends IBaseRepository<Review> {
  abstract save(review: Review): Promise<void>;
  abstract findByEnrollmentId(enrollmentId: string): Promise<Review | null>;
  abstract delete(review: Review): Promise<void>;
  abstract findById(id: string): Promise<Review | null>;
  abstract findByCourseId(
    courseId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    minRating?: number,
  ): Promise<{ reviews: Review[]; total: number }>;
  abstract findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Review | null>;
  abstract getCourseRatingsBreakdown(
    courseId: string,
  ): Promise<ReviewBreakDown>;
}
