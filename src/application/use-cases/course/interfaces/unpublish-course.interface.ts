import { Course } from "@/domain/entities/course.entity";
import { UnPublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export abstract class IUnPublishCourseUseCase {
  /**
   * Unpublishes an existing course if the user is authorized.
   * Emits an event and logs relevant actions.
   *
   * @param cmd - DTO containing information required to unpublish a course.
   * @returns Updated CourseDto
   * @throws CourseNotFoundException | UnauthorizedException
   */
  abstract execute(cmd: UnPublishCourseRequest): Promise<Course>;
}
