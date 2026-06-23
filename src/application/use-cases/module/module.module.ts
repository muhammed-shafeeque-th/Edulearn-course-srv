import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CreateModuleUseCase } from "./impls/create-module.use-case";
import { GetModuleUseCase } from "./impls/get-module.use-case";
import { GetModulesByCourseUseCase } from "./impls/get-modules-by-course.use-case";
import { UpdateModuleUseCase } from "./impls/update-module.use-case";
import { DeleteModuleUseCase } from "./impls/delete-module.use-case";
import { ICreateModuleUseCase } from "./interfaces/create-module.interface";
import { IGetModuleUseCase } from "./interfaces/get-module.interface";
import { IGetModulesByCourseUseCase } from "./interfaces/get-modules-by-course.interface";
import { IUpdateModuleUseCase } from "./interfaces/update-module.interface";
import { IDeleteModuleUseCase } from "./interfaces/delete-module.interface";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateModuleUseCase, useClass: CreateModuleUseCase },
    { provide: IGetModuleUseCase, useClass: GetModuleUseCase },
    {
      provide: IGetModulesByCourseUseCase,
      useClass: GetModulesByCourseUseCase,
    },
    { provide: IUpdateModuleUseCase, useClass: UpdateModuleUseCase },
    { provide: IDeleteModuleUseCase, useClass: DeleteModuleUseCase },
  ],
  exports: [
    ICreateModuleUseCase,
    IGetModuleUseCase,
    IGetModulesByCourseUseCase,
    IUpdateModuleUseCase,
    IDeleteModuleUseCase,
  ],
})
export class ModuleModule {}
