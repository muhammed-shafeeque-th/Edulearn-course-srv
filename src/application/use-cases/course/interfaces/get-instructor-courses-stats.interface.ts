import {
  GetInstructorCoursesStatsRequest,
  InstructorCoursesStats,
} from "src/infrastructure/grpc/generated/course/types/stats";

export abstract class IGetInstructorCoursesStatsUseCase {
  /**
   * Executes the retrieval of instructor's courses statistics.
   * @param dto - Object containing the instructorId
   */
  abstract execute(
    dto: GetInstructorCoursesStatsRequest,
  ): Promise<InstructorCoursesStats>;
}
