import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { Course } from "src/domain/entities/course.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetCoursesByCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(categoryId: string): Promise<Course[]> {
    return await this.tracer.startActiveSpan(
      "GetCoursesByCategoryUseCase.execute",
      async (span) => {
        span.setAttributes({
          "category.id": categoryId,
        });
        this.logger.log(`Fetching courses by category id ${categoryId}`, {
          ctx: GetCoursesByCategoryUseCase.name,
        });
        const courses =
          await this.categoryRepository.findCoursesByCategory(categoryId);
        return courses;
      },
    );
  }
}
