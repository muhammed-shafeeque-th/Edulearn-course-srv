import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { AddReviewUseCase } from "./impls/add-review.use-case";
import { GetReviewUseCase } from "./impls/get-review.use-case";
import { GetReviewsByCourseUseCase } from "./impls/get-reviews-by-course.use-case";
import { UpdateReviewUseCase } from "./impls/update-review.use-case";
import { DeleteReviewUseCase } from "./impls/delete-review.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetReviewByEnrollmentUseCase } from "./impls/get-review-by-enrollment.use-case";
import { IAddReviewUseCase } from "./interfaces/add-review.interface";
import { IGetReviewUseCase } from "./interfaces/get-review.interface";
import { IGetReviewsByCourseUseCase } from "./interfaces/get-reviews-by-course.interface";
import { IUpdateReviewUseCase } from "./interfaces/update-review.interface";
import { IDeleteReviewUseCase } from "./interfaces/delete-review.interface";
import { IGetReviewByEnrollmentUseCase } from "./interfaces/get-review-by-enrollment.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: IAddReviewUseCase, useClass: AddReviewUseCase },
    { provide: IGetReviewUseCase, useClass: GetReviewUseCase },
    {
      provide: IGetReviewsByCourseUseCase,
      useClass: GetReviewsByCourseUseCase,
    },
    {
      provide: IGetReviewByEnrollmentUseCase,
      useClass: GetReviewByEnrollmentUseCase,
    },
    { provide: IUpdateReviewUseCase, useClass: UpdateReviewUseCase },
    { provide: IDeleteReviewUseCase, useClass: DeleteReviewUseCase },
  ],
  exports: [
    IAddReviewUseCase,
    IGetReviewUseCase,
    IGetReviewsByCourseUseCase,
    IGetReviewByEnrollmentUseCase,
    IUpdateReviewUseCase,
    IDeleteReviewUseCase,
  ],
})
export class ReviewModule {}
