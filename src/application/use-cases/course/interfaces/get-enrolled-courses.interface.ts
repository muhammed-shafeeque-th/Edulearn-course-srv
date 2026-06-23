import { CourseDto } from "../../../dtos/course.dto";

export abstract class IGetEnrolledCoursesUseCase {
  abstract execute(
    userId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseDto[]; total: number }>;
}
