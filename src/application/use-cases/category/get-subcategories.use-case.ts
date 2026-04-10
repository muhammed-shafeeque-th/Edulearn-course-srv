import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryDto } from "src/application/dtos/category.dto";

@Injectable()
export class GetSubcategoriesUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(parentId: string): Promise<CategoryDto[]> {
    return await this.tracer.startActiveSpan(
      "GetSubcategoriesUseCase.execute",
      async () => {
        const subcategories =
          await this.categoryRepository.findSubcategories(parentId);

        return subcategories.map(CategoryDto.fromDomain);
      },
    );
  }
}
