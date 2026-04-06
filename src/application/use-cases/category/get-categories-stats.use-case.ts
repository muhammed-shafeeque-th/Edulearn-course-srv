import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryDto } from "src/application/dtos/category.dto";
import {
  CategoriesStats,
  GetCategoriesStatsRequest,
} from "src/infrastructure/grpc/generated/course/types/category";
@Injectable()
export class GetCategoriesStatsUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: GetCategoriesStatsRequest): Promise<CategoriesStats> {
    return await this.tracer.startActiveSpan(
      "GetCategoriesStatsUseCase.execute",
      async () => {
        this.logger.debug(
          `[GetCategoriesStatsUseCase] Fetching categories stats`,
        );

        let stats = await this.categoryRepository.getStats(dto.top);
        if (!stats) {
          this.logger.warn(`[GetCategoriesStatsUseCase] No categories stats`);
        }

        return { stats: stats ?? [] };
      },
    );
  }
}
