import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { LoggingService } from "../observability/logging/logging.service";
import { MetricsService } from "../observability/metrics/metrics.service";
import { finalize, Observable, tap } from "rxjs";
import { Metadata } from "@grpc/grpc-js";
import { context, propagation, trace } from "@opentelemetry/api";

/**
 * Interceptor providing:
 *  - Distributed trace context extraction from incoming gRPC metadata and activation in OTEL context
 *  - Logging and Metrics for gRPC service requests
 */
@Injectable()
export class GrpcInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggingService,
    private readonly metrics: MetricsService
  ) {}

  intercept(
    ctx: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    const call = ctx.switchToRpc();
    const metadata: Metadata = call.getContext();
    const method = ctx.getHandler().name;

    // Helper to extract string headers from gRPC metadata for propogation
    function otelMetadataGetter(carrier: Metadata, key: string): string | string[] | undefined {
      // gRPC metadata keys are always lowercase
      const values = carrier.get(key);
      if (!values || values.length === 0) return undefined;
      // OTEL expects string/string[] only, ignore buffers
      const asStrings = values
        .map((v) => typeof v === "string" ? v : undefined)
        .filter((v): v is string => v !== undefined);
      if (asStrings.length === 0) return undefined;
      return asStrings.length === 1 ? asStrings[0] : asStrings;
    }
    function otelMetadataKeys(carrier: Metadata): string[] {
      return Object.keys(carrier.getMap());
    }

    // ---  Extract OTEL context from incoming gRPC Metadata (i.e., traceparent, tracestate) ---
    // This enables distributed tracing: OTEL will look for "traceparent"/"tracestate" in metadata as with HTTP headers
    const extractedContext = propagation.extract(context.active(), metadata, {
      get: otelMetadataGetter,
      keys: otelMetadataKeys,
    });

    // ---  Optionally attach the new context for downstream code execution (so spans etc are linked correctly)
    // This pattern makes sure OTEL context is activated for all downstream (handler) logic
    // This also ensures any logs or new spans created have proper parent trace

    // --- Logging & Metrics (start) ---
    this.logger.debug(`gRPC request received to method ${method}`, {
      ctx: GrpcInterceptor.name,
    });
    const endRequest = this.metrics.measureRequestDuration(method);
    this.metrics.incrementRequestCounter(method);
    const start = Date.now();
    let status = "success";

    // Activate context for the downstream call
    return context.with(extractedContext, () =>
      next.handle().pipe(
        tap({
          error: (error) => {
            status = "error";
            this.logger.error(`gRPC method ${method} failed: ${error.message}`, {
              error,
              ctx: GrpcInterceptor.name,
            });
            this.metrics.incrementErrorCounter(method);
          },
        }),
        finalize(() => {
          const duration = (Date.now() - start) / 1000; // seconds
          endRequest();
          this.logger.debug(
            `gRPC method ${method} completed with status ${status} in ${duration}s`,
            { ctx: GrpcInterceptor.name }
          );
        })
      )
    );
  }
}
