import { Injectable } from "@nestjs/common";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryNotFoundException } from "src/domain/exceptions/category.exceptions";

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(categoryId: string): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteCategoryUseCase.execute",
      async () => {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) throw new CategoryNotFoundException("Category not found");

        await this.categoryRepository.delete(categoryId);
        this.logger.debug(`Deleted category: ${categoryId}`);
      },
    );
  }
}
