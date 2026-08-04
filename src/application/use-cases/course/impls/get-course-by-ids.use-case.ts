import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { CourseDto } from "../../../dtos/course.dto";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { GetCourseByIdsRequestDto } from "src/presentation/grpc/dtos/course/get-course-by-ids.dto";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";
import { IGetCoursesByIdsUseCase } from "../interfaces/get-course-by-ids.interface";

@Injectable()
export class GetCoursesByIdsUseCase implements IGetCoursesByIdsUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: GetCourseByIdsRequestDto,
  ): Promise<{ courses: CourseMetadataDto[] }> {
    return await this._tracer.startActiveSpan(
      "GetCoursesByIdsUseCase.execute",
      async (span) => {
        this._logger.log(
          `Fetching  courses for ${dto.courseIds.length} courses`,
          {
            ctx: GetCoursesByIdsUseCase.name,
          },
        );

        const courses = await this._courseRepository.findByIds(dto.courseIds);

        const courseDtos = courses.map(CourseMetadataDto.fromPrimitive);

        span.setAttribute("course.length", courseDtos.length);

        this._logger.log(`Fetch all available courses`, {
          ctx: GetCoursesByIdsUseCase.name,
        });
        return { courses: courseDtos };
      },
    );
  }
}
