import { Injectable } from "@nestjs/common";
import { ICourseRepository } from "../../../../domain/repositories/course.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import {
  GetInstructorCoursesStatsRequest,
  InstructorCoursesStats,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IGetInstructorCoursesStatsUseCase } from "../interfaces/get-instructor-courses-stats.interface";

@Injectable()
export class GetInstructorCoursesStatsUseCase implements IGetInstructorCoursesStatsUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _reviewRepository: IReviewRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  /**
   * Executes the retrieval of instructor's courses statistics.
   * @param dto - Object containing the instructorId
   */
  async execute(
    dto: GetInstructorCoursesStatsRequest,
  ): Promise<InstructorCoursesStats> {
    return this._tracer.startActiveSpan(
      "GetInstructorCoursesStatsUseCase.execute",
      async (span) => {
        const { instructorId } = dto;
        this._logger.debug(
          `Fetching course stats for instructor ${instructorId}`,
          { ctx: GetInstructorCoursesStatsUseCase.name },
        );
        span.setAttribute("instructor.id", instructorId);

        try {
          // Fetch statistics in parallel for performance
          const [instructorCourseStats, instructorEnrollmentStats] =
            await Promise.all([
              this._courseRepository.getInstructorCoursesStats(instructorId),
              this._enrollmentRepository.getInstructorCoursesEnrollmentSummery(
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

          this._logger.debug(
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
        } catch (error: any) {
          this._logger.error(
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
