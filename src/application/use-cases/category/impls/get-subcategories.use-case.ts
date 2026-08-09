import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetSubcategoriesUseCase } from "../interfaces/get-subcategories.interface";

@Injectable()
export class GetSubcategoriesUseCase implements IGetSubcategoriesUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(parentId: string): Promise<Category[]> {
    return await this._tracer.startActiveSpan(
      "GetSubcategoriesUseCase.execute",
      async () => {
        const subcategories =
          await this._categoryRepository.findSubcategories(parentId);

        return subcategories;
      },
    );
  }
}
