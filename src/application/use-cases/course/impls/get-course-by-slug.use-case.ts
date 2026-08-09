import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { Course } from "@/domain/entities/course.entity";
import { IGetCourseBySlugUseCase } from "../interfaces/get-course-by-slug.interface";

@Injectable()
export class GetCourseBySlugUseCase implements IGetCourseBySlugUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(slug: string): Promise<Course> {
    return this._tracer.startActiveSpan(
      "GetCourseBySlugUseCase.execute",
      async (span) => {
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


        return course;
      },
    );
  }
}
