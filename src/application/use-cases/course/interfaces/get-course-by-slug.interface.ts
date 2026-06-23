import { CourseDto } from "src/application/dtos/course.dto";

export abstract class IGetCourseBySlugUseCase {
  abstract execute(slug: string): Promise<CourseDto>;
}
