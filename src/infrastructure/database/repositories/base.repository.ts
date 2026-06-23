import { Injectable } from "@nestjs/common";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";

/**
 * BaseRepository handles cross-cutting concerns for all repository operations.
 * Sub-repositories should extend this class and wrap their logic within `execute`.
 */
@Injectable()
export abstract class BaseRepository {
  protected abstract readonly contextName: string;

  constructor(
    protected readonly logger: LoggingService,
    protected readonly tracer: TracingService,
    protected readonly metrics: MetricsService,
  ) {}

  /**
   * Executes a database operation within a standardized wrapper.
   * Handles:
   * - Tracing (Starts active span)
   * - Metrics (Duration and request counters)
   * - Logging (Error logging)
   * - Error Handling (Logs and re-throws)
   *
   * @param operationName Name of the operation (e.g., 'save', 'findById')
   * @param operation The async function containing the business logic
   * @param attributes Optional attributes to add to the span/context
   */
  protected async execute<T>(
    operationName: string,
    operation: (span: any) => Promise<T>,
    attributes: Record<string, any> = {},
  ): Promise<T> {
    const fullOperationName = `${this.contextName}.${operationName}`;
    const metricPrefix = this.getMetricPrefix();

    return this.tracer.startActiveSpan(fullOperationName, async (span) => {
      // Add initial attributes
      span.setAttributes({
        "db.operation": operationName,
        component: this.contextName,
        ...attributes,
      });

      // Start timing
      const endTimer = this.metrics.measureDBOperationDuration(
        `${metricPrefix}.${operationName}`,
        operationName.toUpperCase(),
      );

      try {
        // Run the operation
        const result = await operation(span);

        // Success handling
        endTimer();
        this.metrics.incrementDBRequestCounter(operationName.toUpperCase());

        return result;
      } catch (error) {
        // Error handling
        endTimer();
        this.metrics.incrementDBRequestCounter(operationName.toUpperCase());

        this.logger.error(
          `Operation ${fullOperationName} failed: ${error instanceof Error ? error.message : error}`,
          {
            ctx: this.contextName,
            error,
            ...attributes,
          },
        );

        span.recordException(error);
        span.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    });
  }

  protected getMetricPrefix(): string {
    return this.contextName
      .replace("TypeOrmRepository", "")
      .replace("Repository", "")
      .toLowerCase();
  }
}
