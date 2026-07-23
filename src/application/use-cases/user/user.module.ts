import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
import { UpdateUserUseCase } from "./impls/update-user.use-case";
import { IUpdateUserUseCase } from "./interfaces/update-user.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule],
  providers: [{ provide: IUpdateUserUseCase, useClass: UpdateUserUseCase }],
  exports: [IUpdateUserUseCase],
})
export class UserModule {}
