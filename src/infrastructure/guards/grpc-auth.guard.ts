import { CanActivate, ExecutionContext } from "@nestjs/common";
import { LoggingService } from "../observability/logging/logging.service";
import { Observable } from "rxjs";
import { Metadata, status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";

export class GrpcAuthGuard implements CanActivate {
  constructor(private readonly logger: LoggingService) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const call = context.switchToRpc();
    const metadata: Metadata = call.getContext();

    let userHeader: string | undefined;
    if (metadata && typeof metadata.getMap === "function") {
      const map = metadata.getMap();
      if (map["x-user"] && Array.isArray(map["x-user"])) {
        userHeader = map["x-user"][0]?.toString();
      }
    }
    // const user: { role: "ADMIN" | "INSTRUCTOR" | "STUDENT" } = JSON.parse(
    //   metadata.getMap()["x-user"][0].toString()
    // );

    if (!userHeader) {
      this.logger.warn(`Not 'user' header provided`, {
        ctx: GrpcAuthGuard.name,
      });
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: "Authentication `user` header is required",
      });
    }

    const method = context.getHandler().name;
    const requiredRoles = this.getRequiredRoles(method);

    if (!requiredRoles.includes((userHeader as unknown as { role: string }).role)) {
      this.logger.warn(
        `User does not have required permission for method ${method}`,
        { ctx: GrpcAuthGuard.name }
      );
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: "Insufficient permission",
      });
    }
    return true;
  }
  private getRequiredRoles(method: string): string[] {
    // Define role requirements for each method
    const roleMap: { [key: string]: string[] } = {
      CreateCourse: ["INSTRUCTOR"],
      UpdateCourse: ["INSTRUCTOR"],
      DeleteCourse: ["INSTRUCTOR"],
      CreateSection: ["INSTRUCTOR"],
      CreateLesson: ["INSTRUCTOR"],
      CreateQuiz: ["INSTRUCTOR"],
      CreateEnrollment: ["STUDENT"],
      CreateProgress: ["STUDENT"],
      CreateReview: ["STUDENT"],
      // Allow all roles for read operations
      GetCourse: ["INSTRUCTOR", "STUDENT"],
      GetCoursesByInstructor: ["INSTRUCTOR"],
      GetEnrolledCourses: ["STUDENT"],
    };

    return roleMap[method] || ["INSTRUCTOR", "STUDENT"];
  }
}
