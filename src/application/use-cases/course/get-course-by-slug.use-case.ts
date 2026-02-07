import { Injectable } from "@nestjs/common";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CourseNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { CourseDto } from "src/application/dtos/course.dto";

@Injectable()
export class GetCourseBySlugUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(slug: string): Promise<CourseDto> {
    return await this.tracer.startActiveSpan(
      "GetCourseBySlugUseCase.execute",
      async (span) => {
        try {
          this.logger.info(
            `Fetching course with slug: ${slug} in ${GetCourseBySlugUseCase.name}`
          );

          const course = await this.courseRepository.findBySlug(slug);
          if (!course) {
            this.logger.debug(`Course not found in DB with slug: ${slug}`);
            throw new CourseNotFoundException(
              `Course with slug ${slug} is not found`
            );
          }

          const courseDto = CourseDto.fromDomain(course);

          return courseDto;
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Failed to fetch data for course slug: ${slug} \n${error.message}`,
            {
              error,
            }
          );

          throw error;
        }
      }
    );
  }
}
