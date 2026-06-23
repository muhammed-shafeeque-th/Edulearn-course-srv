import { Course } from "src/domain/entities/course.entity";

export abstract class IGetCoursesByCategoryUseCase {
  abstract execute(categoryId: string): Promise<Course[]>;
}
