import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CreateModuleUseCase } from "./create-module.use-case";
import { GetModuleUseCase } from "./get-module.use-case";
import { GetModulesByCourseUseCase } from "./get-modules-by-course.use-case";
import { UpdateModuleUseCase } from "./update-module.use-case";
import { DeleteModuleUseCase } from "./delete-module.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    CreateModuleUseCase,
    GetModuleUseCase,
    GetModulesByCourseUseCase,
    UpdateModuleUseCase,
    DeleteModuleUseCase,
  ],
  exports: [
    CreateModuleUseCase,
    GetModuleUseCase,
    GetModulesByCourseUseCase,
    UpdateModuleUseCase,
    DeleteModuleUseCase,
  ],
})
export class ModuleModule {}
