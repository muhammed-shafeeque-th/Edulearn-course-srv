import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { DeleteQuizUseCase } from "./delete-quiz.use-case";
import { UpdateQuizUseCase } from "./update-quiz.use-case";
import { GetQuizzesByCourseUseCase } from "./get-quizes-by-course.use-case";
import { GetQuizUseCase } from "./get-quiz.use-case";
import { CreateQuizUseCase } from "./create-quiz.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
     CreateQuizUseCase,
    GetQuizUseCase,
    GetQuizzesByCourseUseCase,
    UpdateQuizUseCase,
    DeleteQuizUseCase,
  ],
  exports: [
    CreateQuizUseCase,
    GetQuizUseCase,
    GetQuizzesByCourseUseCase,
    UpdateQuizUseCase,
    DeleteQuizUseCase,
  ],
})
export class QuizModule {}
