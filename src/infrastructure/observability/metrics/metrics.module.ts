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
        subsystem: config.serviceName,
        version: config.serviceVersion,
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
