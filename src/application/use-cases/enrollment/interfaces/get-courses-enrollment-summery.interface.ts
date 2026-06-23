import { InstructorCoursesEnrollmentSummery } from "src/domain/repositories/enrollment.repository";
import { GetInstructorCoursesEnrollmentSummeryRequest } from "src/infrastructure/grpc/generated/course/types/stats";

/**
 * Use case to get a summary of enrollments across all courses for an instructor.
 */
export abstract class IGetInstructorCoursesEnrollmentSummeryUseCase {
  abstract execute(
    data: GetInstructorCoursesEnrollmentSummeryRequest,
  ): Promise<InstructorCoursesEnrollmentSummery | null>;
}
