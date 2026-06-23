import { Controller, Get, HttpCode } from "@nestjs/common";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
// import { register } from "prom-client";

@Controller()
export class HealthController {
  constructor(private readonly logger: LoggingService) {}

  @Get("health")
  @HttpCode(200)
  healthCheck() {
    this.logger.info(`Health check requested`, { ctx: HealthController.name });
    return {
      status: "OK",
      service: "Course Service",
      timestamp: new Date().toISOString(),
    };
  }
  // @Get("metrics")
  // @HttpCode(200)
  // async getMetrics() {
  //   this.logger.info(`Metrics requested`, { ctx: HealthController.name });
  //   return await register.metrics();
  // }
}
