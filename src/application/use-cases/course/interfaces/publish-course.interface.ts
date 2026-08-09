import { Course } from "@/domain/entities/course.entity";
import { PublishCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

export abstract class IPublishCourseUseCase {
  /**
   * Publishes a course if the user is authorized (isAdmin or instructor of the course).
   * Also emits a CoursePublishedEvent upon success.
   *
   * @param cmd - PublishCourseRequest with courseId, userId, isAdmin
   * @returns Published CourseDto
   * @throws CourseNotFoundException | UnauthorizedException
   */
  abstract execute(cmd: PublishCourseRequest): Promise<Course>;
}
