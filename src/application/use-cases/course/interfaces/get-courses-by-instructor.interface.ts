import { CourseMetadataDto } from "src/application/dtos/courseMeta.dto";

export abstract class IGetCoursesByInstructorUseCase {
  abstract execute(
    instructorId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<{ courses: CourseMetadataDto[]; total: number }>;
}
