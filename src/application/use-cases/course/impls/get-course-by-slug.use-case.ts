import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { CourseDto } from "src/application/dtos/course.dto";
import { IGetCourseBySlugUseCase } from "../interfaces/get-course-by-slug.interface";

@Injectable()
export class GetCourseBySlugUseCase implements IGetCourseBySlugUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(slug: string): Promise<CourseDto> {
    return await this._tracer.startActiveSpan(
      "GetCourseBySlugUseCase.execute",
      async (span) => {
        try {
           this._logger.debug(
            `Fetching course with slug: ${slug} in ${GetCourseBySlugUseCase.name}`,
          );

          const course = await this._courseRepository.findBySlug(slug);
          if (!course) {
             this._logger.debug(`Course not found in DB with slug: ${slug}`);
            throw new CourseNotFoundException(
              `Course with slug ${slug} is not found`,
            );
          }

          const courseDto = CourseDto.fromDomain(course);

          return courseDto;
        } catch (error: any) {
          span.setAttribute("error", true);
           this._logger.error(
            `Failed to fetch data for course slug: ${slug} \n${error.message}`,
            {
              error,
            },
          );

          throw error;
        }
      },
    );
  }
}
