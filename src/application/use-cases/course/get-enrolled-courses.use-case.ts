import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { CourseDto } from "../../dtos/course.dto";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetEnrolledCoursesUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    userId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseDto[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "GetEnrolledCoursesUseCase.execute",
      async (span) => {
        this.logger.log(`Fetching enrolled courses for user ${userId}`, {
          ctx: GetEnrolledCoursesUseCase.name,
        });

        span.setAttribute("user.id", userId);

        const { courses, total } = await this.courseRepository.findByUserId(
          userId,
          page,
          limit,
          sortBy,
          sortOrder,
        );
        const courseDtos = courses.map(CourseDto.fromDomain);

        this.logger.log(
          `Found ${courseDtos.length} enrolled courses for user ${userId}`,
          { ctx: GetEnrolledCoursesUseCase.name },
        );
        return { courses: courseDtos, total };
      },
    );
  }
}
