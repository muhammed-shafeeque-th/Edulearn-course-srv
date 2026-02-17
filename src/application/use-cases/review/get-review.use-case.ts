import { Injectable } from "@nestjs/common";
import { ReviewDto } from "src/application/dtos/review.dto";
import { ReviewNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(reviewId: string): Promise<ReviewDto> {
    return await this.tracer.startActiveSpan(
      "GetReviewsUseCase.execute",
      async (span) => {
        span.setAttributes({
          "review.id": reviewId,
        });
        this.logger.log(`Fetching review ${reviewId}`, {
          ctx: GetReviewUseCase.name,
        });

        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(`Not found review ${reviewId}`);
        }

        span.setAttribute("review.found", true);
        const reviewDto = ReviewDto.fromDomain(review);

        this.logger.log(`Found review ${reviewId} `, {
          ctx: GetReviewUseCase.name,
        });
        return reviewDto;
      },
    );
  }
}
