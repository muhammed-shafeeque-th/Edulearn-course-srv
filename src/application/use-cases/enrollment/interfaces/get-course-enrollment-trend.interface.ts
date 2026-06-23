import {
  GetInstructorCourseEnrollmentTrendRequest,
  InstructorCourseEnrollmentTrend,
} from "src/infrastructure/grpc/generated/course/types/stats";

export abstract class IGetInstructorCourseEnrollmentTrendUseCase {
  /**
   * Executes the use case to get an instructor's enrollment trend for a specific course.
   * @param data - The request containing instructor and course identifiers.
   * @returns The enrollment trend or null if not found.
   */
  abstract execute(
    data: GetInstructorCourseEnrollmentTrendRequest,
  ): Promise<InstructorCourseEnrollmentTrend | null>;
}
