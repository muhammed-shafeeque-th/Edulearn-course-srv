import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { CourseDto } from "../../../dtos/course.dto";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";
import { IGetCoursesByInstructorUseCase } from "../interfaces/get-courses-by-instructor.interface";

@Injectable()
export class GetCoursesByInstructorUseCase
  implements IGetCoursesByInstructorUseCase
{
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    instructorId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseMetadataDto[]; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetCoursesByInstructorUseCase.execute",
      async (span) => {
         this._logger.log(`Fetching courses for instructor ${instructorId}`, {
          ctx: GetCoursesByInstructorUseCase.name,
        });

        span.setAttribute("instructor.id", instructorId);

        const { data: courses, total } =
          await this._courseRepository.findByInstructorId(
            instructorId,
            page,
            limit,
            sortBy,
            sortOrder,
          );
        const courseDtos = courses.map(CourseMetadataDto.fromPrimitive);

        span.setAttribute("instructor.course.length", courseDtos.length);

         this._logger.log(
          `Found ${courseDtos.length} courses for instructor ${instructorId}`,
          { ctx: GetCoursesByInstructorUseCase.name },
        );
        return { courses: courseDtos, total };
      },
    );
  }
}
