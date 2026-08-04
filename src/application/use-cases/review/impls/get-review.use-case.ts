import { Injectable } from "@nestjs/common";
import { ReviewDto } from "src/application/dtos/review.dto";
import { ReviewNotFoundException } from "src/domain/exceptions/review.exceptions";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetReviewUseCase } from "../interfaces/get-review.interface";

@Injectable()
export class GetReviewUseCase implements IGetReviewUseCase {
  constructor(
    private readonly _reviewRepository: IReviewRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(reviewId: string): Promise<ReviewDto> {
    return await this._tracer.startActiveSpan(
      "GetReviewsUseCase.execute",
      async (span) => {
        span.setAttributes({
          "review.id": reviewId,
        });
        this._logger.log(`Fetching review ${reviewId}`, {
          ctx: GetReviewUseCase.name,
        });

        const review = await this._reviewRepository.findById(reviewId);
        if (!review) {
          span.setAttribute("review.found", false);
          throw new ReviewNotFoundException(`Not found review ${reviewId}`);
        }

        span.setAttribute("review.found", true);
        const reviewDto = ReviewDto.fromDomain(review);

        this._logger.log(`Found review ${reviewId} `, {
          ctx: GetReviewUseCase.name,
        });
        return reviewDto;
      },
    );
  }
}
