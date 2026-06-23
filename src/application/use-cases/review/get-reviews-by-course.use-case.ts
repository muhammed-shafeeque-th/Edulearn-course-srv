import { Injectable } from "@nestjs/common";
import { ReviewDto } from "src/application/dtos/review.dto";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetReviewsByCourseUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    courseId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    minRating?: number,
  ): Promise<{ reviews: ReviewDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetReviewsByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this.logger.log(`Fetching reviews for course ${courseId}`, {
          ctx: GetReviewsByCourseUseCase.name,
        });

        const { reviews, total } = await this.reviewRepository.findByCourseId(
          courseId,
          page,
          limit,
          sortBy,
          sortOrder,
          minRating,
        );
        span.setAttribute("reviews.count", reviews.length);
        const reviewDtos = reviews.map(ReviewDto.fromDomain);

        this.logger.log(
          `Found ${reviewDtos.length} reviews for course ${courseId}`,
          { ctx: GetReviewsByCourseUseCase.name },
        );
        return { reviews: reviewDtos, total };
      },
    );
  }
}
