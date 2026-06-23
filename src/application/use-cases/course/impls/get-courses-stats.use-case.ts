import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetCoursesStatsUseCase } from "../interfaces/get-courses-stats.interface";

@Injectable()
export class GetCoursesStatsUseCase implements IGetCoursesStatsUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(): Promise<{
    totalCourses: number;
    draftCourses: number;
    publishedCourses: number;
    unPublishedCourses: number;
  }> {
    return await this._tracer.startActiveSpan(
      "GetCoursesStatsUseCase.execute",
      async (span) => {
         this._logger.log("Fetching overall courses statistics", {
          ctx: GetCoursesStatsUseCase.name,
        });

        try {
          const stats = await this._courseRepository.getCoursesStats();

          span.setAttribute("courses.total", stats.totalCourses);

           this._logger.log(
            `Fetched courses statistics: totalCourses=${stats.totalCourses}`,
            { ctx: GetCoursesStatsUseCase.name },
          );

          return stats;
        } catch (error) {
           this._logger.error("Failed to fetch courses statistics", {
            ctx: GetCoursesStatsUseCase.name,
            error,
          });
          throw error;
        }
      },
    );
  }
}
