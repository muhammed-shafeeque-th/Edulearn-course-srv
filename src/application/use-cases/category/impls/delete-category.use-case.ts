import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";
import { IDeleteCategoryUseCase } from "../interfaces/delete-category.interface";

@Injectable()
export class DeleteCategoryUseCase implements IDeleteCategoryUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(categoryId: string): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteCategoryUseCase.execute",
      async () => {
        const category = await this._categoryRepository.findById(categoryId);
        if (!category)
          throw new CategoryNotFoundException("Category not found");

        await this._categoryRepository.delete(categoryId);
         this._logger.debug(`Deleted category: ${categoryId}`);
      },
    );
  }
}
