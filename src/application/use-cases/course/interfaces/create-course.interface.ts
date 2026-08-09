import { Course } from "@/domain/entities/course.entity";
import { CreateCourseRequestDto } from "src/presentation/grpc/dtos/course/create-course.dto";

export abstract class ICreateCourseUseCase {
  abstract execute(
    payload: CreateCourseRequestDto,
    idempotencyKey: string,
  ): Promise<Course>;
}
