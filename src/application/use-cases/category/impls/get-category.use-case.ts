import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { Category } from "@/domain/entities/category.entity";
import { CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";
import { IGetCategoryUseCase } from "../interfaces/get-category.interface";

@Injectable()
export class GetCategoryUseCase implements IGetCategoryUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(categoryId: string): Promise<Category> {
    return await this._tracer.startActiveSpan(
      "GetCategoryUseCase.execute",
      async () => {
        const category = await this._categoryRepository.findById(categoryId);
        if (!category)
          throw new CategoryNotFoundException("Category not found");
        return category;
      },
    );
  }
}
