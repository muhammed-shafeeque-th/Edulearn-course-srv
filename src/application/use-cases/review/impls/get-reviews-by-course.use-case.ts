import { Injectable } from "@nestjs/common";
import { Review } from "src/domain/entities/review.entity";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetReviewsByCourseUseCase } from "../interfaces/get-reviews-by-course.interface";

@Injectable()
export class GetReviewsByCourseUseCase implements IGetReviewsByCourseUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    courseId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    minRating?: number,
  ): Promise<{ reviews: Review[]; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetReviewsByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this._logger.log(`Fetching reviews for course ${courseId}`, {
          ctx: GetReviewsByCourseUseCase.name,
        });

        const { reviews, total } = await this._reviewRepository.findByCourseId(
          courseId,
          page,
          limit,
          sortBy,
          sortOrder,
          minRating,
        );
        span.setAttribute("reviews.count", reviews.length);

        this._logger.log(
          `Found ${reviews.length} reviews for course ${courseId}`,
          { ctx: GetReviewsByCourseUseCase.name },
        );
        return { reviews: reviews, total };
      },
    );
  }
}
