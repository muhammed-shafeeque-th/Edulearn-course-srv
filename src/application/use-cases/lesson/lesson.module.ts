import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { DeleteLessonUseCase } from "./delete-lesson.use-case";
import { UpdateLessonUseCase } from "./update-leson.use-case";
import { GetLessonsBySectionUseCase } from "./get-lessons-by-sections.use-case";
import { CreateLessonUseCase } from "./create-lesson.use-case";
import { GetLessonUseCase } from "./get-lesson.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    CreateLessonUseCase,
    GetLessonsBySectionUseCase,
    GetLessonUseCase,
    UpdateLessonUseCase,
    DeleteLessonUseCase,
  ],
  exports: [
    GetLessonUseCase,
    CreateLessonUseCase,
    GetLessonsBySectionUseCase,
    UpdateLessonUseCase,
    DeleteLessonUseCase,
  ],
})
export class LessonModule {}
