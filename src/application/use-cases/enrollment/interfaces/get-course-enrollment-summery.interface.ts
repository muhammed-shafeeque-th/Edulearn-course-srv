import {
  GetInstructorCourseEnrollmentSummeryRequest,
  InstructorCourseEnrollmentSummery,
} from "src/infrastructure/grpc/generated/course/types/stats";

/**
 * Use case to get a summary of enrollments for a specific course and instructor.
 */
export abstract class IGetInstructorCourseEnrollmentSummeryUseCase {
  /**
   * Executes the use case to get an instructor's enrollment summary for a specific course.
   * @param data - The request containing instructor and course identifiers.
   * @returns The enrollment summary or null if not found.
   */
  abstract execute(
    data: GetInstructorCourseEnrollmentSummeryRequest,
  ): Promise<InstructorCourseEnrollmentSummery | null>;
}
