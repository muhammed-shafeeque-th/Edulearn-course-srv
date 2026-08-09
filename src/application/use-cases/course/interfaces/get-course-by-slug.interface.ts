import { Course } from "@/domain/entities/course.entity";

export abstract class IGetCourseBySlugUseCase {
  abstract execute(slug: string): Promise<Course>;
}
