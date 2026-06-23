import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CategoryDto } from "src/application/dtos/category.dto";
import slugify from "slugify";
import {
  CategoryAlreadyExistException,
  CategoryNotFoundException,
} from "src/domain/exceptions/category.exceptions";
import { IUpdateCategoryUseCase } from "../interfaces/update-category.interface";

interface UpdateCategoryInput {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  parentId?: string;
}

@Injectable()
export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateCategoryInput): Promise<CategoryDto> {
    return await this._tracer.startActiveSpan(
      "UpdateCategoryUseCase.execute",
      async () => {
        const category = await this._categoryRepository.findById(dto.id);
        let slug: string;

        if (!category)
          throw new CategoryNotFoundException("Category not found");

        if (dto.name) {
          slug = slugify(dto.name, { lower: true, strict: true });

          const categoryExist = await this._categoryRepository.findBySlug(slug);
          if (categoryExist && categoryExist.getId() !== dto.id) {
            throw new CategoryAlreadyExistException(categoryExist.getName());
          }
        }

        category.updateDetails(
          dto.name || category.getName(),
          slug || category.getSlug(),
          dto.description,
          dto.icon,
          dto.color,
          dto.order,
          dto.parentId,
        );

        await this._categoryRepository.update(category);
         this._logger.debug(`Updated category: ${dto.id}`);

        return CategoryDto.fromDomain(category);
      },
    );
  }
}
