import { Module } from "@nestjs/common";
import { AppLoggerModule } from "./infrastructure/observability/logging/logging.module";
import { AppTracerModule } from "./infrastructure/observability/tracing/tracing.module";
import { AppMetricsModule } from "./infrastructure/observability/metrics/metrics.module";
import { GrpcPresentationModule } from "./presentation/grpc/grpc.module";
import { KafkaPresentationModule } from "./presentation/kafka/kafka.module";
// import { HttpModule } from "./presentation/__http/http.module";
import { ConfigModule } from "./infrastructure/config/config.module";
import { AppHealthModule } from "./infrastructure/health/health.module";

@Module({
  imports: [
    ConfigModule,

    AppLoggerModule,
    AppTracerModule,
    AppMetricsModule,


    GrpcPresentationModule,
    KafkaPresentationModule,

    AppHealthModule
  ],
})
export class AppModule {}
