import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetCoursesStatsUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) { }

  /**
   * Fetch overall statistics about courses.
   * @returns An object containing statistics for all courses in the system.
   */
  async execute(): Promise<{ totalCourses: number, draftCourses: number; publishedCourses: number; unPublishedCourses: number; }> {
    return await this.tracer.startActiveSpan(
      "GetCoursesStatsUseCase.execute",
      async (span) => {
        this.logger.log("Fetching overall courses statistics", {
          ctx: GetCoursesStatsUseCase.name,
        });

        try {
          const stats = await this.courseRepository.getCoursesStats();

          span.setAttribute("courses.total", stats.totalCourses);

          this.logger.log(
            `Fetched courses statistics: totalCourses=${stats.totalCourses}`,
            { ctx: GetCoursesStatsUseCase.name },
          );

          return stats;
        } catch (error) {
          this.logger.error("Failed to fetch courses statistics", {
            ctx: GetCoursesStatsUseCase.name,
            error,
          });
          throw error;
        }
      },
    );
  }
}
