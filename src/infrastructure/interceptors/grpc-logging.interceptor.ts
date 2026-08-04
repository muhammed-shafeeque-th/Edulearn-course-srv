import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, finalize } from "rxjs/operators";
import { context, trace, SpanStatusCode } from "@opentelemetry/api";

import { ILoggerService } from "@/application/adaptors/logger.service";
import { IMetricService } from "@/application/adaptors/metric.service";

@Injectable()
export class GrpcInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: ILoggerService,
    private readonly metrics: IMetricService,
  ) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const method = executionContext.getHandler().name;

    const span = trace.getSpan(context.active());

    const stopTimer = this.metrics.measureRequestDuration(method);

    this.metrics.incrementRequestCounter(method);

    this.logger.debug(`gRPC request started`, {
      method,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          span?.setStatus({
            code: SpanStatusCode.OK,
          });
        },

        error: (error) => {
          span?.recordException(error);

          span?.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });

          this.metrics.incrementErrorCounter(method);

          this.logger.error(`gRPC request failed`, {
            method,
            error,
          });
        },
      }),

      finalize(() => {
        stopTimer();

        this.logger.debug(`gRPC request completed`, {
          method,
        });
      }),
    );
  }
}
