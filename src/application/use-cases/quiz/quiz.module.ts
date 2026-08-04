import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
import { DeleteQuizUseCase } from "./impls/delete-quiz.use-case";
import { UpdateQuizUseCase } from "./impls/update-quiz.use-case";
import { GetQuizzesByCourseUseCase } from "./impls/get-quizes-by-course.use-case";
import { GetQuizUseCase } from "./impls/get-quiz.use-case";
import { CreateQuizUseCase } from "./impls/create-quiz.use-case";
import { IDeleteQuizUseCase } from "./interfaces/delete-quiz.interface";
import { IUpdateQuizUseCase } from "./interfaces/update-quiz.interface";
import { IGetQuizzesByCourseUseCase } from "./interfaces/get-quizes-by-course.interface";
import { IGetQuizUseCase } from "./interfaces/get-quiz.interface";
import { ICreateQuizUseCase } from "./interfaces/create-quiz.interface";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateQuizUseCase, useClass: CreateQuizUseCase },
    { provide: IGetQuizUseCase, useClass: GetQuizUseCase },
    {
      provide: IGetQuizzesByCourseUseCase,
      useClass: GetQuizzesByCourseUseCase,
    },
    { provide: IUpdateQuizUseCase, useClass: UpdateQuizUseCase },
    { provide: IDeleteQuizUseCase, useClass: DeleteQuizUseCase },
  ],
  exports: [
    ICreateQuizUseCase,
    IGetQuizUseCase,
    IGetQuizzesByCourseUseCase,
    IUpdateQuizUseCase,
    IDeleteQuizUseCase,
  ],
})
export class QuizModule {}
