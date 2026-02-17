import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CreateProgressUseCase } from "./create-progress.user-case";
import { GetProgressUseCase } from "./get-progress.use-case";
import { GetProgressesByEnrollmentUseCase } from "./get-progress-by-enrollment.use-case";
import { UpdateProgressUseCase } from "./update-progress.use-case";
import { DeleteProgressUseCase } from "./delete-progress.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetEnrollmentProgressUseCase } from "./get-enrollment-progress.use-case";
import { SubmitQuizAttemptUseCase } from "./submit-quiz-attempt.use-case";
import { UpdateLessonProgressUseCase } from "./update-lesson-progress.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    CreateProgressUseCase,
    GetProgressUseCase,
    GetProgressesByEnrollmentUseCase,
    GetEnrollmentProgressUseCase,
    SubmitQuizAttemptUseCase,
    UpdateLessonProgressUseCase,
    // UpdateProgressUseCase,
    DeleteProgressUseCase,
  ],
  exports: [
    CreateProgressUseCase,
    GetProgressUseCase,
    GetProgressesByEnrollmentUseCase,
    GetEnrollmentProgressUseCase,
    SubmitQuizAttemptUseCase,
    UpdateLessonProgressUseCase,
    // UpdateProgressUseCase,
    DeleteProgressUseCase,
  ],
})
export class ProgressModule {}
