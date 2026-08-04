import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
import { CreateProgressUseCase } from "./impls/create-progress.user-case";
import { GetProgressUseCase } from "./impls/get-progress.use-case";
import { GetProgressesByEnrollmentUseCase } from "./impls/get-progress-by-enrollment.use-case";
import { UpdateProgressUseCase } from "./impls/update-progress.use-case";
import { DeleteProgressUseCase } from "./impls/delete-progress.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetEnrollmentProgressUseCase } from "./impls/get-enrollment-progress.use-case";
import { SubmitQuizAttemptUseCase } from "./impls/submit-quiz-attempt.use-case";
import { UpdateLessonProgressUseCase } from "./impls/update-lesson-progress.use-case";
import { ICreateProgressUseCase } from "./interfaces/create-progress.interface";
import { IGetProgressUseCase } from "./interfaces/get-progress.interface";
import { IGetProgressesByEnrollmentUseCase } from "./interfaces/get-progress-by-enrollment.interface";
import { IUpdateProgressUseCase } from "./interfaces/update-progress.interface";
import { IDeleteProgressUseCase } from "./interfaces/delete-progress.interface";
import { IGetEnrollmentProgressUseCase } from "./interfaces/get-enrollment-progress.interface";
import { ISubmitQuizAttemptUseCase } from "./interfaces/submit-quiz-attempt.interface";
import { IUpdateLessonProgressUseCase } from "./interfaces/update-lesson-progress.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateProgressUseCase, useClass: CreateProgressUseCase },
    { provide: IGetProgressUseCase, useClass: GetProgressUseCase },
    {
      provide: IGetProgressesByEnrollmentUseCase,
      useClass: GetProgressesByEnrollmentUseCase,
    },
    {
      provide: IGetEnrollmentProgressUseCase,
      useClass: GetEnrollmentProgressUseCase,
    },
    { provide: ISubmitQuizAttemptUseCase, useClass: SubmitQuizAttemptUseCase },
    {
      provide: IUpdateLessonProgressUseCase,
      useClass: UpdateLessonProgressUseCase,
    },
    // {provide: IUpdateProgressUseCase, useClass: UpdateProgressUseCase},
    { provide: IDeleteProgressUseCase, useClass: DeleteProgressUseCase },
  ],
  exports: [
    ICreateProgressUseCase,
    IGetProgressUseCase,
    IGetProgressesByEnrollmentUseCase,
    IGetEnrollmentProgressUseCase,
    ISubmitQuizAttemptUseCase,
    IUpdateLessonProgressUseCase,
    // IUpdateProgressUseCase,
    IDeleteProgressUseCase,
  ],
})
export class ProgressModule {}
