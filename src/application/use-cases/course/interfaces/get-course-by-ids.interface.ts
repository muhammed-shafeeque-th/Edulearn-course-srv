import { GetCourseByIdsRequestDto } from "src/presentation/grpc/dtos/course/get-course-by-ids.dto";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";

export abstract class IGetCoursesByIdsUseCase {
  abstract execute(
    dto: GetCourseByIdsRequestDto,
  ): Promise<{ courses: CourseMetadataDto[] }>;
}
