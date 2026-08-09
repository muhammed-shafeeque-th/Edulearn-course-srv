import { Course } from "@/domain/entities/course.entity";

export abstract class IGetEnrolledCoursesUseCase {
  abstract execute(
    userId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: Course[]; total: number }>;
}
