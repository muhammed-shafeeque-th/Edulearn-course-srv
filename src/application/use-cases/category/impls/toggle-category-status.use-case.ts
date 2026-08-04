import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CategoryDto } from "src/application/dtos/category.dto";
import { CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";
import { IToggleCategoryStatusUseCase } from "../interfaces/toggle-category-status.interface";

@Injectable()
export class ToggleCategoryStatusUseCase implements IToggleCategoryStatusUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(categoryId: string): Promise<CategoryDto> {
    return await this._tracer.startActiveSpan(
      "ToggleCategoryStatusUseCase.execute",
      async () => {
        const category = await this._categoryRepository.findById(categoryId);
        if (!category)
          throw new CategoryNotFoundException("Category not found");

        category.toggleStatus();

        // If restoring a deleted category
        if (category.getIsActive() && category.getDeletedAt()) {
          category.restore();
        }

        await this._categoryRepository.update(category);
        this._logger.debug(`Toggled category status: ${categoryId}`);

        return CategoryDto.fromDomain(category);
      },
    );
  }
}
