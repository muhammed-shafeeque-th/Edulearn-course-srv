import { Injectable } from "@nestjs/common";
import { Exception, Span } from "@opentelemetry/api";
import { ICacheService } from "src/application/adaptors/cache-service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IMetricService } from "src/application/adaptors/metric.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { DeepPartial, FindManyOptions, Repository } from "typeorm";

/**
 * BaseRepository handles cross-cutting concerns for all repo operations.
 * Sub-repositories should extend this class and wrap their logic within `execute`.
 */
@Injectable()
export abstract class BaseRepository<TDomain, TOrm, ID = string> {
  protected abstract readonly contextName: string;
  constructor(
    protected readonly repo: Repository<TOrm>,
    protected readonly logger: ILoggerService,
    protected readonly tracer: ITraceService,
    protected readonly metrics?: IMetricService,
    protected readonly cache?: ICacheService,
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
    operation: (span: Span) => Promise<T>,
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
      const endTimer = this.metrics?.measureDBOperationDuration(
        `${metricPrefix}.${operationName}`,
        operationName.toUpperCase() as any,
      );

      try {
        // Run the operation
        const result = await operation(span);

        // Success handling
        endTimer?.();
        this.metrics.incrementDBRequestCounter(
          operationName.toUpperCase() as any,
        );

        return result;
      } catch (error) {
        // Error handling
        endTimer?.();
        this.metrics?.incrementDBRequestCounter(
          operationName.toUpperCase() as any,
        );

        this.logger.error(
          `Operation ${fullOperationName} failed: ${error instanceof Error ? error.message : error}`,
          {
            ctx: this.contextName,
            error,
            ...attributes,
          },
        );

        span.recordException(error as Exception);
        span.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    });
  }

  // async findById(id: ID): Promise<TDomain | null> {
  //   return this.repo.findOne({
  //     where: { id } as any,
  //   });
  // }

  // async findAll(): Promise<TDomain[]> {
  //   return this.repo.find();
  // }

  // async create(entity: DeepPartial<TDomain>): Promise<void> {
  //   const newEntity = this.repo.create(entity);
  //   return this.repo.save(newEntity);
  // }

  // async update(entity: TDomain): Promise<void> {
  //   return this.repo.save(entity);
  // }

  // async delete(id: ID): Promise<void> {
  //   await this.repo.delete(id as any);
  // }

  // async find(options?: {
  //   where?: any;
  //   relations?: string[];
  //   skip?: number;
  //   take?: number;
  //   order?: any;
  // }): Promise<TDomain[]> {
  //   const findOptions: FindManyOptions<TDomain> = {
  //     where: options?.where,
  //     relations: options?.relations,
  //     skip: options?.skip,
  //     take: options?.take,
  //     order: options?.order,
  //   };

  //   return this.repo.find(findOptions);
  // }

  protected async cacheGet<T>(key: string): Promise<T | null> {
    if (!this.cache) return null;
    return this.cache.get<T>(key);
  }

  protected async cacheSet(key: string, value: any, ttl: number) {
    if (!this.cache) return;
    await this.cache.set(key, value, ttl);
  }

  protected async cacheInvalidate(keys: string[]) {
    if (!this.cache) return;
    await Promise.allSettled(keys.map((k) => this.cache!.del(k)));
  }

  protected getMetricPrefix(): string {
    return this.contextName
      .replace("TypeOrmRepository", "")
      .replace("Repository", "")
      .toLowerCase();
  }
}
