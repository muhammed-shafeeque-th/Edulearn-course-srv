import { GetCoursesParamsDto } from "src/presentation/grpc/dtos/course/get-courses-params.dto";
import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";

export abstract class IListCoursesUseCase {
  abstract execute(
    params: GetCoursesParamsDto,
  ): Promise<{ courses: CourseMetadataDto[]; total: number }>;
}
