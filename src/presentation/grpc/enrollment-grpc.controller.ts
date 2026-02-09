import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { GetEnrollmentsByUserUseCase } from "src/application/use-cases/enrollment/get-enrollment-by-user.use-case";
import { GetEnrollmentsByCourseUseCase } from "src/application/use-cases/enrollment/get-enrollment-by-course.use-case";
import { UpdateEnrollmentUseCase } from "src/application/use-cases/progress/update-enrollment.use-case";
import { DeleteEnrollmentUseCase } from "src/application/use-cases/enrollment/delete-enrollment.use-case";
import {
  CheckCourseEnrollmentRequest,
  CheckEnrollmentRequest,
  CheckEnrollmentResponse,
  DeleteEnrollmentRequest,
  DeleteEnrollmentResponse,
  EnrollmentResponse,
  EnrollmentsResponse,
  GetEnrollmentDetailsResponse,
  GetEnrollmentRequest,
  GetEnrollmentResponse,
  GetEnrollmentsByCourseRequest,
  GetEnrollmentsByUserRequest,
  UpdateEnrollmentRequest,
} from "src/infrastructure/grpc/generated/course/types/enrollment";
import { EnrollmentStatus } from "src/domain/entities/enrollment.entity";
import { GetEnrollmentDetailUseCase } from "src/application/use-cases/enrollment/get-enrollment-detail-use-case";
import { CheckEnrollmentUseCase } from "src/application/use-cases/enrollment/check-enrollment.use-case";
import { CheckCourseEnrollmentUseCase } from "src/application/use-cases/enrollment/check-course-enrollment.use-case";
import { GetEnrollmentUseCase } from "src/application/use-cases/enrollment/get-enrollment.use-case";
import { GetInstructorCourseEnrollmentSummeryRequest, GetInstructorCourseEnrollmentSummeryResponse, GetInstructorCourseEnrollmentTrendRequest, GetInstructorCourseEnrollmentTrendResponse, GetInstructorCourseRatingStatsRequest, GetInstructorCourseRatingStatsResponse, GetInstructorCoursesEnrollmentSummeryRequest, GetInstructorCoursesEnrollmentSummeryResponse, GetMonthlyCoursesEnrollmentStatsRequest, GetMonthlyCoursesEnrollmentStatsResponse, GetRevenueStatsRequest, GetRevenueStatsResponse } from "src/infrastructure/grpc/generated/course/types/stats";
import { GetInstructorCoursesEnrollmentSummeryUseCase } from "src/application/use-cases/enrollment/get-courses-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentSummeryUseCase } from "src/application/use-cases/enrollment/get-course-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentTrendUseCase } from "src/application/use-cases/enrollment/get-course-enrollment-trend.use-case";
import { GetInstructorCourseRatingStatsUseCase } from "src/application/use-cases/course/get-instructor-course-rating-stats.use-case";
import { GetMonthlyCoursesEnrollmentStatsUseCase } from "src/application/use-cases/enrollment/get-monthly-course-enrollment-summery.use-case";
import { GetRevenueStatsUseCase } from "src/application/use-cases/enrollment/get-revenue-stats.use-case";

@Controller()
export class EnrollmentGrpcController {
  constructor(
    private readonly getEnrollmentDetailsUseCase: GetEnrollmentDetailUseCase,
    private readonly checkEnrollmentUseCase: CheckEnrollmentUseCase,
    private readonly getEnrollmentUseCase: GetEnrollmentUseCase,
    private readonly checkCourseEnrollmentUseCase: CheckCourseEnrollmentUseCase,
    private readonly getEnrollmentsByUserUseCase: GetEnrollmentsByUserUseCase,
    private readonly getEnrollmentsByCourseUseCase: GetEnrollmentsByCourseUseCase,
    private readonly updateEnrollmentUseCase: UpdateEnrollmentUseCase,
    private readonly getInstructorCoursesEnrollmentSummeryUseCase: GetInstructorCoursesEnrollmentSummeryUseCase,
    private readonly getInstructorCourseEnrollmentSummeryUseCase: GetInstructorCourseEnrollmentSummeryUseCase,
    private readonly getInstructorCourseEnrollmentTrendUseCase: GetInstructorCourseEnrollmentTrendUseCase,
    private readonly getMonthlyCoursesEnrollmentStatsUseCase: GetMonthlyCoursesEnrollmentStatsUseCase,
    private readonly getRevenueStatsUseCase: GetRevenueStatsUseCase,
    private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("EnrollmentService", "GetEnrollmentDetails")
  async getEnrollmentDetails(
    data: GetEnrollmentRequest,
    metadata: Metadata
  ): Promise<GetEnrollmentDetailsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetEnrollmentDetails",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const enrollmentDetails =
            await this.getEnrollmentDetailsUseCase.execute(
              data.enrollmentId,
              data.userId
            );
          return {
            enrollment: enrollmentDetails,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get enrollment details: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "GetEnrollment")
  async getEnrollment(
    data: GetEnrollmentRequest,
    metadata: Metadata
  ): Promise<GetEnrollmentResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const enrollmentDto = await this.getEnrollmentUseCase.execute(
            data.enrollmentId,
            data.userId
          );
          return {
            enrollment: enrollmentDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get enrollment: ${error.message}` +
        JSON.stringify(error, null, 2),
        {
          error,
        }
      );

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "CheckEnrollment")
  async checkEnrollment(
    data: CheckEnrollmentRequest,
    metadata: Metadata
  ): Promise<CheckEnrollmentResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.CheckEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const { enrolled } = await this.checkEnrollmentUseCase.execute(
            data.enrollmentId,
            data.userId
          );
          return {
            enrolled,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get enrollment: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "CheckCourseEnrollment")
  async checkCourseEnrollment(
    data: CheckCourseEnrollmentRequest,
    metadata: Metadata
  ): Promise<CheckEnrollmentResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.CheckCourseEnrollment",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("user.id", data.userId);

          const { enrolled } = await this.checkCourseEnrollmentUseCase.execute(
            data.courseId,
            data.userId
          );
          return {
            enrolled,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get enrollment: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "UpdateEnrollment")
  async updateEnrollment(
    data: UpdateEnrollmentRequest,
    metadata: Metadata
  ): Promise<EnrollmentResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.UpdateEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const enrollmentDto = await this.updateEnrollmentUseCase.execute(
            data.enrollmentId,
            EnrollmentStatus[data.status]
          );
          return {
            enrollment: enrollmentDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update enrollment: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "DeleteEnrollment")
  async deleteEnrollment(
    data: DeleteEnrollmentRequest,
    metadata: Metadata
  ): Promise<DeleteEnrollmentResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.DeleteEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          await this.deleteEnrollmentUseCase.execute(data.enrollmentId);
          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete enrollment: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetEnrollmentsByUser")
  async getEnrollmentsByUser(
    data: GetEnrollmentsByUserRequest,
    metadata: Metadata
  ): Promise<EnrollmentsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetEnrollmentsByUser",
        async (span) => {
          span.setAttribute("user.id", data.userId);

          const enrollments = await this.getEnrollmentsByUserUseCase.execute(
            data.userId
          );
          return {
            enrollments: {
              enrollments: enrollments?.map((enrollment) =>
                enrollment.toGrpcResponse()
              ),
              total: 1,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get enrollments by user: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetEnrollmentsByCourse")
  async getEnrollmentsByCourse(
    data: GetEnrollmentsByCourseRequest,
    metadata: Metadata
  ): Promise<EnrollmentsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetEnrollmentsByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          const enrollments = await this.getEnrollmentsByCourseUseCase.execute(
            data.courseId
          );
          return {
            enrollments: {
              enrollments: enrollments?.map((enrollment) =>
                enrollment.toGrpcResponse()
              ),
              total: 1,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get enrollments by course: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "GetInstructorCoursesEnrollmentSummery")
  async getInstructorCoursesEnrollmentSummery(
    data: GetInstructorCoursesEnrollmentSummeryRequest,
    _metadata: Metadata
  ): Promise<GetInstructorCoursesEnrollmentSummeryResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetInstructorCoursesEnrollmentSummery",
        async (span) => {
          // Best practice: log and trace using existing data shape, avoid hardcoded/wrong field access
          span.setAttribute("instructor.id", data.instructorId);

          this.logger.log(
            `gRPC: Fetching enrollments summary for instructor ${data.instructorId}`,
            { ctx: EnrollmentGrpcController.name }
          );

          const summary = await this.getInstructorCoursesEnrollmentSummeryUseCase.execute(data);

          return {
            success: summary,
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get instructor courses enrollment summary: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "GetRevenueStats")
  async getRevenueStats(
    data: GetRevenueStatsRequest,
    _metadata: Metadata
  ): Promise<GetRevenueStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetRevenueStats",
        async (span) => {
          // Best practice: log and trace using existing data shape, avoid hardcoded/wrong field access
          span.setAttribute("year.id", data.year);

          this.logger.log(
            `gRPC: Fetching revenue stats  for year ${data.year}`,
            { ctx: EnrollmentGrpcController.name }
          );

          const summary = await this.getRevenueStatsUseCase.execute(data);

          return {
            success: summary,
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get revenue stats : ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetInstructorCourseEnrollmentSummery")
  async getInstructorCourseEnrollmentSummery(
    data: GetInstructorCourseEnrollmentSummeryRequest,
    _metadata: Metadata
  ): Promise<GetInstructorCourseEnrollmentSummeryResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetInstructorCourseEnrollmentSummery",
        async (span) => {
          span.setAttribute("instructor.id", data.instructorId);
          span.setAttribute("course.id", data.courseId);

          this.logger.log(
            `gRPC: Fetching enrollment summary for course ${data.courseId}, instructor ${data.instructorId}`,
            { ctx: EnrollmentGrpcController.name }
          );

          const summary = await this.getInstructorCourseEnrollmentSummeryUseCase.execute(data);

          return { success: summary };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get instructor course enrollment summary: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetInstructorCourseEnrollmentTrend")
  async getInstructorCourseEnrollmentTrend(
    data: GetInstructorCourseEnrollmentTrendRequest,
    _metadata: Metadata
  ): Promise<GetInstructorCourseEnrollmentTrendResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetInstructorCourseEnrollmentTrend",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          this.logger.log(
            `gRPC: Fetching enrollment trend for course ${data.courseId}`,
            { ctx: EnrollmentGrpcController.name }
          );

          const trend = await this.getInstructorCourseEnrollmentTrendUseCase.execute(data);

          return { success: trend };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get instructor course enrollment trend: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetMonthlyCoursesEnrollmentStats")
  async getMonthlyCoursesEnrollmentStats(
    data: GetMonthlyCoursesEnrollmentStatsRequest,
    _metadata: Metadata
  ): Promise<GetMonthlyCoursesEnrollmentStatsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetMonthlyCoursesEnrollmentStats",
        async (span) => {
          span.setAttribute("year", data.year);

          this.logger.log(
            `gRPC: Fetching monthly courses enrollment stats for year ${data.year}`,
            { ctx: EnrollmentGrpcController.name }
          );

          const stats = await this.getMonthlyCoursesEnrollmentStatsUseCase.execute(data);

          return { success: stats };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get monthly courses enrollment stats: ${error.message}`,
        { error }
      );

      if (error instanceof DomainException) {
        return { error: this.createErrorResponse(error) };
      }
      throw error;
    }
  }
}
