import { Module} from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CreateSectionUseCase } from "./create-section.use-case";
import { GetSectionUseCase } from "./get-section.use-case";
import { GetSectionsByCourseUseCase } from "./get-sections-by-course.use-case";
import { UpdateSectionUseCase } from "./update-section.use-case";
import { DeleteSectionUseCase } from "./delete-section.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    CreateSectionUseCase,
    GetSectionUseCase,
    GetSectionsByCourseUseCase,
    UpdateSectionUseCase,
    DeleteSectionUseCase,
  ],
  exports: [
    CreateSectionUseCase,
    GetSectionUseCase,
    GetSectionsByCourseUseCase,
    UpdateSectionUseCase,
    DeleteSectionUseCase,
  ],
})
export class SectionModule {}
