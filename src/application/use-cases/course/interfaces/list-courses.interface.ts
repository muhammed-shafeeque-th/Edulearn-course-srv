import { GetCoursesParamsDto } from "src/presentation/grpc/dtos/course/get-courses-params.dto";
import { CourseMetadata } from "@/domain/entities/course.entity";

export abstract class IListCoursesUseCase {
  abstract execute(
    params: GetCoursesParamsDto,
  ): Promise<{ courses: CourseMetadata[]; total: number }>;
}
