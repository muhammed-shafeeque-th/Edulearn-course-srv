import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { DeleteLessonUseCase } from "./impls/delete-lesson.use-case";
import { UpdateLessonUseCase } from "./impls/update-leson.use-case";
import { GetLessonsByModuleUseCase } from "./impls/get-lessons-by-modules.use-case";
import { CreateLessonUseCase } from "./impls/create-lesson.use-case";
import { GetLessonUseCase } from "./impls/get-lesson.use-case";
import { IDeleteLessonUseCase } from "./interfaces/delete-lesson.interface";
import { IUpdateLessonUseCase } from "./interfaces/update-leson.interface";
import { IGetLessonsByModuleUseCase } from "./interfaces/get-lessons-by-modules.interface";
import { ICreateLessonUseCase } from "./interfaces/create-lesson.interface";
import { IGetLessonUseCase } from "./interfaces/get-lesson.interface";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateLessonUseCase, useClass: CreateLessonUseCase },
    {
      provide: IGetLessonsByModuleUseCase,
      useClass: GetLessonsByModuleUseCase,
    },
    { provide: IGetLessonUseCase, useClass: GetLessonUseCase },
    { provide: IUpdateLessonUseCase, useClass: UpdateLessonUseCase },
    { provide: IDeleteLessonUseCase, useClass: DeleteLessonUseCase },
  ],
  exports: [
    IGetLessonUseCase,
    ICreateLessonUseCase,
    IGetLessonsByModuleUseCase,
    IUpdateLessonUseCase,
    IDeleteLessonUseCase,
  ],
})
export class LessonModule {}
