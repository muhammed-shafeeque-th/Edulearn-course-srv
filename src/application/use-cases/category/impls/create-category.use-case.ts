import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { Category } from "@/domain/entities/category.entity";
import slugify from "slugify";
import { CategoryAlreadyExistException } from "src/domain/exceptions/category.exceptions";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ICreateCategoryUseCase } from "../interfaces/create-category.interface";

interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  parentId?: string;
}

@Injectable()
export class CreateCategoryUseCase implements ICreateCategoryUseCase {
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: CreateCategoryInput,
    idempotencyKey: string,
  ): Promise<Category> {
    return await this._tracer.startActiveSpan(
      "CreateCategoryUseCase.execute",
      async (span) => {
        const slug = slugify(dto.name, { lower: true, strict: true });

        const categoryExist = await this._categoryRepository.findBySlug(slug);
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
        await this._categoryRepository.create(category);
        this._logger.debug(`Created category: ${dto.name}`);

        return category;
      },
    );
  }
}
