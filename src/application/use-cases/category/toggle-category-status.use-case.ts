import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryDto } from "src/application/dtos/category.dto";
import { CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";

@Injectable()
export class ToggleCategoryStatusUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(categoryId: string): Promise<CategoryDto> {
    return await this.tracer.startActiveSpan(
      "ToggleCategoryStatusUseCase.execute",
      async () => {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) throw new CategoryNotFoundException("Category not found");

        category.toggleStatus();

        // If restoring a deleted category
        if (category.getIsActive() && category.getDeletedAt()) {
          category.restore();
        }

        await this.categoryRepository.update(category);
        this.logger.debug(`Toggled category status: ${categoryId}`);

        return CategoryDto.fromDomain(category);
      },
    );
  }
}
