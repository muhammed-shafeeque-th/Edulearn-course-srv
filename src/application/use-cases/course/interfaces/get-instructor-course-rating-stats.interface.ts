import {
  GetInstructorCourseRatingStatsRequest,
  InstructorCourseRatingStats,
} from "src/infrastructure/grpc/generated/course/types/stats";

export abstract class IGetInstructorCourseRatingStatsUseCase {
  abstract execute(
    dto: GetInstructorCourseRatingStatsRequest,
  ): Promise<InstructorCourseRatingStats>;
}
