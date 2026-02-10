import { Module } from "@nestjs/common";
import { LoggingModule } from "./infrastructure/observability/logging/logging.module";
import { TracingModule } from "./infrastructure/observability/tracing/tracing.module";
import { MetricsModule } from "./infrastructure/observability/metrics/metrics.module";
import { GrpcPresentationModule } from "./presentation/grpc/grpc.module";
import { KafkaPresentationModule } from "./presentation/kafka/kafka.module";
import { HttpModule } from "./presentation/http/http.module";
import { ConfigModule } from "./infrastructure/config/config.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Module({
  imports: [
    ConfigModule,

    LoggingModule,
    TracingModule,
    MetricsModule,

    EventEmitterModule.forRoot(),

    

    GrpcPresentationModule,
    HttpModule,
    KafkaPresentationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
