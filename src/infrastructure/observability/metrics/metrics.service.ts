import { Inject, Injectable } from "@nestjs/common";
import { CounterMetric, GaugeMetric, HistogramMetric } from "@edulearn/core";
import { MetricsService } from "@edulearn/nest";
import { IMetricService } from "src/application/adaptors/metric.service";

@Injectable()
export class MetricService implements IMetricService {
  private gRPCRequestDurationSeconds: HistogramMetric;
  private databaseQueryCounter: CounterMetric;
  private currentRequestCount: GaugeMetric;
  private dbRequestDurationSeconds: HistogramMetric;
  private grpcRequestsTotal: CounterMetric;
  private grpcErrorsTotal: CounterMetric;

  public constructor(private readonly _metric: MetricsService) {
    this.gRPCRequestDurationSeconds = this._metric.histogram({
      name: "grpc_request_duration_seconds",
      help: "Latency of gRPC requests in seconds",
      labelNames: ["method", "status_code"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // More granular buckets
    });

    this.databaseQueryCounter = this._metric.counter({
      name: "database_queries_total",
      help: "Total number of database queries in Course Service",
      labelNames: ["operation"],
    });

    this.currentRequestCount = this._metric.gauge({
      name: "number_of_current_processing_requests_by_server",
      help: "Current size of the request served by server",
    });

    this.dbRequestDurationSeconds = this._metric.histogram({
      name: "DB_request_duration_seconds",
      help: "Duration of Database requests in seconds",
      labelNames: ["method", "operation"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.grpcRequestsTotal = this._metric.counter({
      name: "grpc_requests_total",
      help: "Total number of gRPC requests",
      labelNames: ["method", "status_code"],
    });

    this.grpcErrorsTotal = this._metric.counter({
      name: "grpc_errors_total",
      help: "Total number of gRPC errors",
      labelNames: ["method", "status_code"],
    });
  }
  // Use the pre-defined metric instances directly
  public measureDBOperationDuration(
    method: string,
    operation?: string,
  ): () => void {
    const end = this.dbRequestDurationSeconds.startTimer({ method, operation });
    return () => {
      end();
    };
  }
  public measureRequestDuration(method: string): () => void {
    const end = this.gRPCRequestDurationSeconds.startTimer({ method });
    return (status_code?: string) => {
      end({ status_code }); // Ensure status code is a string label
    };
  }

  public incrementRequestCounter(method: string, statusCode?: number): void {
    this.grpcRequestsTotal.inc({
      method,
      status_code: statusCode?.toString() || "known",
    });
  }
  public incrementDBRequestCounter(operation?: string): void {
    this.databaseQueryCounter.inc({ operation });
  }

  public incrementErrorCounter(method: string, statusCode?: number): void {
    this.grpcErrorsTotal.inc({
      method,
      status_code: statusCode?.toString() || "unknown",
    });
  }

  // // Generic counter increment for custom metrics (requires pre-defined metric instance)
  // // Best practice: Inject specific metric instances or use a factory if many custom metrics.
  // incrementCounter(metricName: string, labels?: MetricLabels): void {
  //   // This method assumes you have a way to get the specific Counter instance by name.
  //   // For simplicity, you might export specific counters from setup.ts and use them directly.
  //   // Example: `customBusinessCounter.inc(labels);`
  //   const counter = promClient.register.getSingleMetric(metricName);
  //   if (counter && counter instanceof promClient.Counter) {
  //     counter.inc(labels);
  //   } else {
  //     console.warn(
  //       `Counter '${metricName}' not found or not a Counter instance.`,
  //     );
  //   }
  // }

  // Expose metrics for Prometheus to scrape
}
