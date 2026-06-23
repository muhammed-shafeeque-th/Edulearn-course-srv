import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { CourseDto } from "../../../dtos/course.dto";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetEnrolledCoursesUseCase } from "../interfaces/get-enrolled-courses.interface";

@Injectable()
export class GetEnrolledCoursesUseCase implements IGetEnrolledCoursesUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    userId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseDto[]; total: number }> {
    return await this._tracer.startActiveSpan(
      "GetEnrolledCoursesUseCase.execute",
      async (span) => {
         this._logger.log(`Fetching enrolled courses for user ${userId}`, {
          ctx: GetEnrolledCoursesUseCase.name,
        });

        span.setAttribute("user.id", userId);

        const { data: courses, total } =
          await this._courseRepository.findByUserId(
            userId,
            page,
            limit,
            sortBy,
            sortOrder,
          );
        const courseDtos = courses.map(CourseDto.fromDomain);

         this._logger.log(
          `Found ${courseDtos.length} enrolled courses for user ${userId}`,
          { ctx: GetEnrolledCoursesUseCase.name },
        );
        return { courses: courseDtos, total };
      },
    );
  }
}
