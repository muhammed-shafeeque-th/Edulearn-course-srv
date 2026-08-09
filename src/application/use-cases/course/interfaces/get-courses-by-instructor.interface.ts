import {  CourseMetadata } from "@/domain/entities/course.entity";

export abstract class IGetCoursesByInstructorUseCase {
  abstract execute(
    instructorId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseMetadata[]; total: number }>;
}
