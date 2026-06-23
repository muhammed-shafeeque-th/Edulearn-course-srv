import { Injectable } from "@nestjs/common";
import { DeleteCourseRequest } from "src/infrastructure/grpc/generated/course/types/course";

/**
 * Use case responsible for deleting a course.
 * Supports tracing, logging, authorization, and emits domain events.
 */
@Injectable()
export abstract class IDeleteCourseUseCase {
  /**
   * Soft deletes a course. Only admins or owner instructors are authorized.
   * Emits CourseDeletedEvent on success.
   * @param cmd - DeleteCourseRequest containing courseId, userId, isAdmin.
   * @throws CourseNotFoundException | UnauthorizedException
   */
  abstract execute(cmd: DeleteCourseRequest): Promise<void>;
}
