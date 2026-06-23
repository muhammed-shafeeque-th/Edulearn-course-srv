import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TracingService } from "./trace.service";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { AppConfigService } from "src/infrastructure/config/config.service";

@Global()
@Module({
  providers: [
    TracingService,
    {
      provide: "OTEL_SDK",
      useFactory: async (configService: AppConfigService) => {
        const { serviceName, jaegerEndpoint, tracingSamplingRatio, nodeEnv } =
          configService;

        const resource = resourceFromAttributes({
          [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        });

        const sampler =
          nodeEnv === "production"
            ? new ParentBasedSampler({
                root: new TraceIdRatioBasedSampler(tracingSamplingRatio),
              })
            : new ParentBasedSampler({
                root: new TraceIdRatioBasedSampler(1.0),
              });

        const exporter = jaegerEndpoint
          ? new OTLPTraceExporter({ url: jaegerEndpoint })
          : undefined;

        const spanProcessor =
          nodeEnv === "production" && exporter
            ? new BatchSpanProcessor(exporter)
            : exporter
              ? new SimpleSpanProcessor(exporter)
              : undefined;
        const sdk = new NodeSDK({
          resource,
          spanProcessor,
          sampler,
          instrumentations: [getNodeAutoInstrumentations()],
        });
        sdk.start();

        process.on("SIGTERM", () => {
          sdk
            .shutdown()
            .then(() => console.log(`OpenTelemetry SDK shut down successfully`))
            .catch((err) =>
              console.error("Error shutting down OpenTelemetry SDK", err),
            )
            .finally(() => process.exit(1));
        });

        return sdk;
      },
      inject: [AppConfigService],
    },
  ],
  exports: [TracingService],
})
export class TracingModule {}
