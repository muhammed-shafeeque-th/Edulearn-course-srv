import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CategoryDto } from "src/application/dtos/category.dto";
@Injectable()
export class GetAllCategoriesUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: {
    includeDeleted?: boolean;
    activeOnly?: boolean;
  }): Promise<CategoryDto[]> {
    return await this.tracer.startActiveSpan(
      "GetAllCategoriesUseCase.execute",
      async () => {
        let categories = await this.categoryRepository.findAll();

        if (!dto.includeDeleted) {
          categories = categories.filter((c) => !c.getDeletedAt());
        }

        if (dto.activeOnly) {
          categories = categories.filter((c) => c.getIsActive());
        }

        return categories.map(CategoryDto.fromDomain);
      },
    );
  }
}
