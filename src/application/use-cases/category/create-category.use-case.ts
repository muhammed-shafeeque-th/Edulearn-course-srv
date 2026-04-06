import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { Category } from "src/domain/entities/category.entity";
import { CategoryDto } from "src/application/dtos/category.dto";
import slugify from "slugify";
import { CategoryAlreadyExistException } from "src/domain/exceptions/category.exceptions";

interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  parentId?: string;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    dto: CreateCategoryInput,
    idempotencyKey: string,
  ): Promise<CategoryDto> {
    return await this.tracer.startActiveSpan(
      "CreateCategoryUseCase.execute",
      async (span) => {
        const slug = slugify(dto.name, { lower: true, strict: true });

        const categoryExist = await this.categoryRepository.findBySlug(slug);
        if (categoryExist) {
          span.setAttribute("course.title.already_exist", true);
          throw new CategoryAlreadyExistException(categoryExist.getName());
        }

        const category = new Category(uuidv4(), dto.name, slug, {
          idempotencyKey,
          description: dto.description,
          icon: dto.icon,
          color: dto.color,
          order: dto.order,
          parentId: dto.parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await this.categoryRepository.create(category);
        this.logger.debug(`Created category: ${dto.name}`);

        return CategoryDto.fromDomain(category);
      },
    );
  }
}
