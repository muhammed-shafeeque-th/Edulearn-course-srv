import {
  GetMonthlyCoursesEnrollmentStatsRequest,
  MonthlyCoursesEnrollmentStats,
  MonthlyCoursesEnrollment,
} from "src/infrastructure/grpc/generated/course/types/stats";

/**
 * Use case to fetch monthly enrollment statistics for all courses for a given year.
 */
export abstract class IGetMonthlyCoursesEnrollmentStatsUseCase {
  /**
   * Executes the use case to get monthly enrollment stats for all courses for a given year.
   * @param data - The request containing the target year.
   * @returns The monthly courses enrollment stats, or null if not found.
   */
  abstract execute(
    data: GetMonthlyCoursesEnrollmentStatsRequest,
  ): Promise<MonthlyCoursesEnrollmentStats | null>;
}
