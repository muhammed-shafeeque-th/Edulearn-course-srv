import { Module } from "@nestjs/common";
import { HealthController } from "./http.controller";

@Module({
  controllers: [HealthController],
})
export class HttpModule {}
