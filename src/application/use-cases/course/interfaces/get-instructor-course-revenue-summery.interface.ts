import {
  GetInstructorCourseRevenueSummeryRequest,
  InstructorCourseRevenueSummery,
} from "src/infrastructure/grpc/generated/course/types/stats";

export abstract class IGetInstructorCourseRevenueSummeryUseCase {
  abstract execute(
    dto: GetInstructorCourseRevenueSummeryRequest,
  ): Promise<InstructorCourseRevenueSummery>;
}
