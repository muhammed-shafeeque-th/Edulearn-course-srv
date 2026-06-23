import { Injectable } from "@nestjs/common";
import { Category } from "src/domain/entities/category.entity";
import { Course } from "src/domain/entities/course.entity";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetCoursesByCategoryUseCase } from "../interfaces/get-courses-by-category.interface";

@Injectable()
export class GetCoursesByCategoryUseCase
  implements IGetCoursesByCategoryUseCase
{
  constructor(
    private readonly _categoryRepository: ICategoryRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(categoryId: string): Promise<Course[]> {
    return await this._tracer.startActiveSpan(
      "GetCoursesByCategoryUseCase.execute",
      async (span) => {
        span.setAttributes({
          "category.id": categoryId,
        });
         this._logger.log(`Fetching courses by category id ${categoryId}`, {
          ctx: GetCoursesByCategoryUseCase.name,
        });
        const courses =
          await this._categoryRepository.findCoursesByCategory(categoryId);
        return courses;
      },
    );
  }
}
