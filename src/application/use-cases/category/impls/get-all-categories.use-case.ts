import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetAllCategoriesUseCase } from "../interfaces/get-all-categories.interface";
@Injectable()
export class GetAllCategoriesUseCase implements IGetAllCategoriesUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: {
    includeDeleted?: boolean;
    activeOnly?: boolean;
  }): Promise<Category[]> {
    return await this._tracer.startActiveSpan(
      "GetAllCategoriesUseCase.execute",
      async () => {
        let categories = await this._categoryRepository.findAll();

        if (!dto.includeDeleted) {
          categories = categories.filter((c) => !c.getDeletedAt());
        }

        if (dto.activeOnly) {
          categories = categories.filter((c) => c.getIsActive());
        }

        return categories;
      },
    );
  }
}
