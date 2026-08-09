import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import {
  CategoriesStats,
  GetCategoriesStatsRequest,
} from "src/infrastructure/grpc/generated/course/types/category";
import { IGetCategoriesStatsUseCase } from "../interfaces/get-categories-stats.interface";

@Injectable()
export class GetCategoriesStatsUseCase implements IGetCategoriesStatsUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: GetCategoriesStatsRequest): Promise<CategoriesStats> {
    return await this._tracer.startActiveSpan(
      "GetCategoriesStatsUseCase.execute",
      async () => {
        this._logger.debug(
          `[GetCategoriesStatsUseCase] Fetching categories stats`,
        );

        const stats = await this._categoryRepository.getStats(dto.top);
        if (!stats) {
          this._logger.warn(`[GetCategoriesStatsUseCase] No categories stats`);
        }

        return { stats: stats ?? [] };
      },
    );
  }
}
