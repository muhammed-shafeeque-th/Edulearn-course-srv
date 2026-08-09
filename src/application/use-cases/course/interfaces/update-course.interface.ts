import { Course } from "@/domain/entities/course.entity";
import { UpdateCourseRequestDto } from "src/presentation/grpc/dtos/course/update-course-request.dto";

export abstract class IUpdateCourseUseCase {
  abstract execute(dto: UpdateCourseRequestDto): Promise<Course>;
}
