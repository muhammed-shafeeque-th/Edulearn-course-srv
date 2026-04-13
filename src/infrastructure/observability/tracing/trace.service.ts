import { Injectable } from "@nestjs/common";
import {
  Span,
  Tracer,
  trace,
  context,
  Attributes,
  SpanStatusCode,
  Context,
} from "@opentelemetry/api"; // Import Tracer and SpanStatusCode
import { AppConfigService } from "src/infrastructure/config/config.service";

@Injectable()
export class TracingService {
  private tracer: Tracer; // Explicitly type the tracer

  public constructor(private readonly configService: AppConfigService) {
    this.tracer = trace.getTracer(this.configService.serviceName); // Initialize tracer with service name
  }

  // Starts a new span and makes it active in the current context
  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T | Promise<T>,
    attributes?: Attributes,
  ): T | Promise<T> {
    return this.tracer.startActiveSpan(name, (span) => {
      if (attributes) {
        span.setAttributes(attributes);
      }
      try {
        const result = fn(span);
        // If the function returns a Promise, ensure the span ends after the promise resolves/rejects
        if (result instanceof Promise) {
          return result
            .then((res) => {
              span.setStatus({
                code: SpanStatusCode.OK,
                message: "Operation has been successful",
              });
              return res;
            })
            .catch((error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message || "Operation failed",
              });
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }

        span.setStatus({
          code: SpanStatusCode.OK,
          message: "Operation has been successful",
        });
        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
        // For synchronous functions, end the span here
        // Only end the span if result is not a Promise
        // We cannot call fn(span) again here, so we rely on the above logic
      }
    });
  }

  // Starts a non-active span (useful if you manage context manually or for specific async flows)
  startSpan(
    name: string,
    attributes?: Attributes | Record<string | any, string | any>,
    contextOverride?: Context,
  ): Span {
    const ctx = contextOverride || context.active();
    const span = this.tracer.startSpan(name, { attributes }, ctx);
    return span;
  }

  endSpan(span: Span): void {
    span.end();
  }

  recordException(span: Span, error: any): void {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message }); // Set span status to ERROR on exception
  }

  setStatus(span: Span, code: SpanStatusCode, message?: string): void {
    // Use OpenTelemetry SpanStatusCode
    span.setStatus({ code, message });
  }

  setAttribute(span: Span, key: string, value: any): void {
    span.setAttribute(key, value);
  }

  // Get the current active span (useful for adding attributes to an existing span)
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }
}
