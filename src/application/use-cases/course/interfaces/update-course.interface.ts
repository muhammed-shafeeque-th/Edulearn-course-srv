import { CourseDto } from "src/application/dtos/course.dto";
import { UpdateCourseRequestDto } from "src/presentation/grpc/dtos/course/update-course-request.dto";

export abstract class IUpdateCourseUseCase {
  abstract execute(dto: UpdateCourseRequestDto): Promise<CourseDto>;
}
