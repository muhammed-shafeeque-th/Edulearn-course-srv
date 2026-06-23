import { Module } from "@nestjs/common";
import { UserModule } from "src/application/use-cases/user/user.module";
import { OrderConsumer } from "./consumers/order.consumer";
import { UserConsumer } from "./consumers/user.consumer";
import { OrderHandler } from "./handlers/order.handler";
import { UserHandler } from "./handlers/user.handler";
import { EnrollmentModule } from "src/application/use-cases/enrollment/enrollment.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";

@Module({
  imports: [
    RedisModule,
    UserModule,
    EnrollmentModule
  ],
  providers: [ OrderHandler, UserHandler],

  controllers: [OrderConsumer, UserConsumer],
})
export class KafkaPresentationModule { }
