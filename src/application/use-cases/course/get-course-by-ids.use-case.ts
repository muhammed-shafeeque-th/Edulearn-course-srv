import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { CourseDto } from "../../dtos/course.dto";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { GetCourseByIdsRequestDto } from "src/presentation/grpc/dtos/course/get-course-by-ids.dto";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";

@Injectable()
export class GetCoursesByIdsUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    dto: GetCourseByIdsRequestDto
  ): Promise<{ courses: CourseMetadataDto[] }> {
    return await this.tracer.startActiveSpan(
      "GetCoursesByIdsUseCase.execute",
      async (span) => {
        this.logger.log(
          `Fetching  courses for ${dto.courseIds.length} courses`,
          {
            ctx: GetCoursesByIdsUseCase.name,
          }
        );

        const courses = await this.courseRepository.findByIds(dto.courseIds);

        console.log(JSON.stringify(courses, null, 2));

        const courseDtos = courses.map(CourseMetadataDto.fromPrimitive);

        span.setAttribute("course.length", courseDtos.length);

        this.logger.log(`Fetch all available courses`, {
          ctx: GetCoursesByIdsUseCase.name,
        });
        return { courses: courseDtos };
      }
    );
  }
}
