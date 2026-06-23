import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { AddReviewUseCase } from "./add-review.use-case";
import { GetReviewUseCase } from "./get-review.use-case";
import { GetReviewsByCourseUseCase } from "./get-reviews-by-course.use-case";
import { UpdateReviewUseCase } from "./update-review.use-case";
import { DeleteReviewUseCase } from "./delete-review.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetReviewByEnrollmentUseCase } from "./get-review-by-enrollment.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    AddReviewUseCase,
    GetReviewUseCase,
    GetReviewsByCourseUseCase,
    GetReviewByEnrollmentUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
  ],
  exports: [
    AddReviewUseCase,
    GetReviewUseCase,
    GetReviewsByCourseUseCase,
    GetReviewByEnrollmentUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
  ],
})
export class ReviewModule {}
