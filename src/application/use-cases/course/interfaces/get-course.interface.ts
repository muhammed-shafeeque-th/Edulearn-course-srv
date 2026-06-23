import { CourseDto } from "src/application/dtos/course.dto";

export abstract class IGetCourseUseCase {
  abstract execute(id: string): Promise<CourseDto>;
}
