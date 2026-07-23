import { Global, Module } from "@nestjs/common";
import { MetricService } from "./metrics.service";
import { IMetricService } from "src/application/adaptors/metric.service";
import { MetricsModule } from "@edulearn/nest";
import { AppConfigService } from "@/infrastructure/config/config.service";

@Global()
@Module({
  imports: [
    MetricsModule.forRootAsync({
      inject: [AppConfigService],

      useFactory: (config: AppConfigService) => ({
        namespace: config.nodeEnv,
        subsystem: "course_service" ,

        version: config.serviceVersion,
        port: config.apiPort,
        defaultLabels: {
          service: config.serviceName,
        },
      }),
    }),
  ],
  providers: [{ provide: IMetricService, useClass: MetricService }],
  exports: [IMetricService],
})
export class AppMetricsModule {}
