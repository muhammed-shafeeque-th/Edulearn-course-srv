import { Injectable } from "@nestjs/common";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CourseNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { CourseDto } from "src/application/dtos/course.dto";

@Injectable()
export class GetCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(id: string): Promise<CourseDto> {
    return await this.tracer.startActiveSpan(
      "GetCourseUseCase.execute",
      async (span) => {
        try {
          this.logger.info(
            `Fetching course with ID: ${id} in ${GetCourseUseCase.name}`
          );


          this.logger.debug(`Query DB for course ${id}`);
          const course = await this.courseRepository.findById(id);
          if (!course) {
            this.logger.debug(`Course not found in DB with Id: ${id}`);
            throw new CourseNotFoundException(`Course with ID ${id} not found`);
          }

          const courseDto = CourseDto.fromDomain(course);
          return courseDto;
        } catch (error) {
          span.setAttribute("error", true);
          this.logger.error(
            `Failed to fetch data for course ID: ${id} ${error.message}`,
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
