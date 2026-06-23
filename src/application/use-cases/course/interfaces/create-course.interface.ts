import { CourseDto } from "../../../dtos/course.dto";
import { CreateCourseRequestDto } from "src/presentation/grpc/dtos/course/create-course.dto";

export abstract class ICreateCourseUseCase {
  abstract execute(
    payload: CreateCourseRequestDto,
    idempotencyKey: string,
  ): Promise<CourseDto>;
}
