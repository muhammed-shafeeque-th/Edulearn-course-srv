import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../domain/repositories/course.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import {
  GetInstructorCoursesStatsRequest,
  InstructorCoursesStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";

@Injectable()
export class GetInstructorCoursesStatsUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  /**
   * Executes the retrieval of instructor's courses statistics.
   * @param dto - Object containing the instructorId
   */
  async execute(
    dto: GetInstructorCoursesStatsRequest,
  ): Promise<InstructorCoursesStats> {
    return this.tracer.startActiveSpan(
      "GetInstructorCoursesStatsUseCase.execute",
      async (span) => {
        const { instructorId } = dto;
        this.logger.log(
          `Fetching course stats for instructor ${instructorId}`,
          { ctx: GetInstructorCoursesStatsUseCase.name },
        );
        span.setAttribute("instructor.id", instructorId);

        try {
          // Fetch statistics in parallel for performance
          const [instructorCourseStats, instructorEnrollmentStats] =
            await Promise.all([
              this.courseRepository.getInstructorCoursesStats(instructorId),
              this.enrollmentRepository.getInstructorCoursesEnrollmentSummery(
                instructorId,
              ),
            ]);

          // let averageRating = 0;
          // if (instructorCourses && instructorCourses.courses.length > 0) {
          //   const totalRatings = instructorCourses.courses.reduce(
          //     (sum, course) => (typeof course.rating === "number" ? sum + course.rating : sum),
          //     0
          //   );
          //   averageRating = totalRatings / instructorCourses.courses.length;
          // }

          // Defensive - Safe extraction for stats values
          const totalCourses = instructorCourseStats?.totalCourses ?? 0;
          const publishedCourses = instructorCourseStats?.publishedCourses ?? 0;
          const draftCourses = instructorCourseStats?.draftCourses ?? 0;
          const totalStudents = instructorEnrollmentStats?.totalStudents ?? 0;
          const totalEarnings = instructorEnrollmentStats?.totalEarnings ?? 0;

          const averageRevenue =
            totalStudents > 0 ? totalEarnings / totalStudents : 0;

          const averageRating = instructorCourseStats?.averageRating ?? 0;

          this.logger.log(
            `Fetched instructor course stats: total=${totalCourses}, published=${publishedCourses}, draft=${draftCourses}`,
            { ctx: GetInstructorCoursesStatsUseCase.name },
          );
          span.setAttributes({
            "courses.total": totalCourses,
            "courses.published": publishedCourses,
            "courses.draft": draftCourses,
            "courses.totalStudents": totalStudents,
            "courses.averageRating": averageRating,
            "courses.totalRevenue": totalEarnings,
          });

          const result: InstructorCoursesStats = {
            totalCourses,
            publishedCourses,
            draftCourses,
            totalStudents,
            averageRating: Math.round(averageRating),
            // totalRevenue: totalEarnings,
            averageRevenue: Math.round(averageRevenue),
            // totalEarnings: totalEarnings,
            totalHoursTaught: instructorCourseStats?.totalHoursTaught ?? 0,
            totalReviews: instructorCourseStats?.totalRatings ?? 0,
            enrollmentGrowth: instructorEnrollmentStats.enrollmentGrowth ?? 0,
          };
          return result;
        } catch (error) {
          this.logger.error(
            `Failed to fetch instructor's courses stats for ${instructorId}`,
            {
              ctx: GetInstructorCoursesStatsUseCase.name,
              error,
            },
          );
          span.setAttribute("error", true);
          span.setAttribute("error.message", error?.message || "Unknown error");
          throw error;
        }
      },
    );
  }
}
