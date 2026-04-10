import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryDto } from "src/application/dtos/category.dto";
import slugify from "slugify";
import { CategoryAlreadyExistException, CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";

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
export class UpdateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: UpdateCategoryInput): Promise<CategoryDto> {
    return await this.tracer.startActiveSpan(
      "UpdateCategoryUseCase.execute",
      async () => {
        const category = await this.categoryRepository.findById(dto.id);
        let slug: string;
        
        if (!category) throw new CategoryNotFoundException("Category not found");

        if (dto.name) {
          slug = slugify(dto.name, { lower: true, strict: true });
          
          const categoryExist = await this.categoryRepository.findBySlug(slug);
          if (
            categoryExist && categoryExist.getId() !== dto.id
          ) {
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

        await this.categoryRepository.update(category);
        this.logger.debug(`Updated category: ${dto.id}`);

        return CategoryDto.fromDomain(category);
      },
    );
  }
}
