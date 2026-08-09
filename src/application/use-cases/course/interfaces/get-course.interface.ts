import { Course } from "@/domain/entities/course.entity";

export abstract class IGetCourseUseCase {
  abstract execute(id: string): Promise<Course>;
}
