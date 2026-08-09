import { GetCourseByIdsRequestDto } from "src/presentation/grpc/dtos/course/get-course-by-ids.dto";
import { CourseMetadata } from "@/domain/entities/course.entity";

export abstract class IGetCoursesByIdsUseCase {
  abstract execute(dto: GetCourseByIdsRequestDto): Promise<CourseMetadata[]>;
}
