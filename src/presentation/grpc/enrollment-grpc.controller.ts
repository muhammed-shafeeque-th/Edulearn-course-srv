import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { IGetEnrollmentsByUserUseCase } from "src/application/use-cases/enrollment/interfaces/get-enrollment-by-user.interface";
import { IGetEnrollmentsByCourseUseCase } from "src/application/use-cases/enrollment/interfaces/get-enrollment-by-course.interface";
// import { UpdateEnrollmentUseCase } from "src/application/use-cases/progress/update-enrollment.use-case";
import { IDeleteEnrollmentUseCase } from "src/application/use-cases/enrollment/interfaces/delete-enrollment.interface";
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
import { IGetEnrollmentDetailUseCase } from "src/application/use-cases/enrollment/interfaces/get-enrollment-detail.interface";
import { ICheckEnrollmentUseCase } from "src/application/use-cases/enrollment/interfaces/check-enrollment.interface";
import { ICheckCourseEnrollmentUseCase } from "src/application/use-cases/enrollment/interfaces/check-course-enrollment.interface";
import { IGetEnrollmentUseCase } from "src/application/use-cases/enrollment/interfaces/get-enrollment.interface";
import {
  GetEnrollmentTrendRequest,
  GetEnrollmentTrendResponse,
  GetInstructorCourseEnrollmentSummeryRequest,
  GetInstructorCourseEnrollmentSummeryResponse,
  GetInstructorCourseEnrollmentTrendRequest,
  GetInstructorCourseEnrollmentTrendResponse,
  GetInstructorCourseRatingStatsRequest,
  GetInstructorCourseRatingStatsResponse,
  GetInstructorCourseRevenueSummeryRequest,
  GetInstructorCourseRevenueSummeryResponse,
  GetInstructorCoursesEnrollmentSummeryRequest,
  GetInstructorCoursesEnrollmentSummeryResponse,
  GetMonthlyCoursesEnrollmentStatsRequest,
  GetMonthlyCoursesEnrollmentStatsResponse,
  GetRevenueStatsRequest,
  GetRevenueStatsResponse,
} from "src/infrastructure/grpc/generated/course/types/stats";
import { IGetInstructorCoursesEnrollmentSummeryUseCase } from "src/application/use-cases/enrollment/interfaces/get-courses-enrollment-summery.interface";
import { IGetInstructorCourseEnrollmentSummeryUseCase } from "src/application/use-cases/enrollment/interfaces/get-course-enrollment-summery.interface";
import { IGetInstructorCourseEnrollmentTrendUseCase } from "src/application/use-cases/enrollment/interfaces/get-course-enrollment-trend.interface";
import { IGetInstructorCourseRatingStatsUseCase } from "src/application/use-cases/course/interfaces/get-instructor-course-rating-stats.interface";
import { IGetInstructorCourseRevenueSummeryUseCase } from "src/application/use-cases/course/interfaces/get-instructor-course-revenue-summery.interface";
import { IGetMonthlyCoursesEnrollmentStatsUseCase } from "src/application/use-cases/enrollment/interfaces/get-monthly-course-enrollment-summery.interface";
import { IGetRevenueStatsUseCase } from "src/application/use-cases/enrollment/interfaces/get-revenue-stats.interface";
import { IGetEnrollmentTrendUseCase } from "src/application/use-cases/enrollment/interfaces/get-enrollment-trend.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { EnrollmentMapper } from "../mappers/enrollment.mapper";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class EnrollmentGrpcController {
  constructor(
    private readonly _getEnrollmentDetailsUseCase: IGetEnrollmentDetailUseCase,
    private readonly _checkEnrollmentUseCase: ICheckEnrollmentUseCase,
    private readonly _getEnrollmentUseCase: IGetEnrollmentUseCase,
    private readonly _checkCourseEnrollmentUseCase: ICheckCourseEnrollmentUseCase,
    private readonly _getEnrollmentsByUserUseCase: IGetEnrollmentsByUserUseCase,
    private readonly _getEnrollmentsByCourseUseCase: IGetEnrollmentsByCourseUseCase,
    // private readonly updateEnrollmentUseCase: IUpdateEnrollmentUseCase,
    private readonly _getInstructorCoursesEnrollmentSummeryUseCase: IGetInstructorCoursesEnrollmentSummeryUseCase,
    private readonly _getInstructorCourseEnrollmentSummeryUseCase: IGetInstructorCourseEnrollmentSummeryUseCase,
    private readonly _getInstructorCourseEnrollmentTrendUseCase: IGetInstructorCourseEnrollmentTrendUseCase,
    private readonly _getEnrollmentTrendUseCase: IGetEnrollmentTrendUseCase,
    private readonly _getMonthlyCoursesEnrollmentStatsUseCase: IGetMonthlyCoursesEnrollmentStatsUseCase,
    private readonly _getRevenueStatsUseCase: IGetRevenueStatsUseCase,
    private readonly _deleteEnrollmentUseCase: IDeleteEnrollmentUseCase,
    private readonly _getInstructorCourseRevenueSummeryUseCase: IGetInstructorCourseRevenueSummeryUseCase,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
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
    metadata: Metadata,
  ): Promise<GetEnrollmentDetailsResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetEnrollmentDetails",
      async (span) => {
        span.setAttribute("enrollment.id", data.enrollmentId);

        const enrollmentDetails =
          await this._getEnrollmentDetailsUseCase.execute(
            data.enrollmentId,
            data.userId,
          );
        return {
          enrollment: enrollmentDetails,
        };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "GetEnrollment")
  async getEnrollment(
    data: GetEnrollmentRequest,
    metadata: Metadata,
  ): Promise<GetEnrollmentResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetEnrollment",
      async (span) => {
        span.setAttribute("enrollment.id", data.enrollmentId);

        const enrollmentDto = await this._getEnrollmentUseCase.execute(
          data.enrollmentId,
          data.userId,
        );
        return {
          enrollment: EnrollmentMapper.toGrpcResponse(enrollmentDto),
        };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "CheckEnrollment")
  async checkEnrollment(
    data: CheckEnrollmentRequest,
    metadata: Metadata,
  ): Promise<CheckEnrollmentResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.CheckEnrollment",
      async (span) => {
        span.setAttribute("enrollment.id", data.enrollmentId);
        span.setAttribute("user.id", data.userId);

        const { enrolled } = await this._checkEnrollmentUseCase.execute(
          data.enrollmentId,
          data.userId,
        );
        return {
          enrolled,
        };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "CheckCourseEnrollment")
  async checkCourseEnrollment(
    data: CheckCourseEnrollmentRequest,
    metadata: Metadata,
  ): Promise<CheckEnrollmentResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.CheckCourseEnrollment",
      async (span) => {
        span.setAttribute("course.id", data.courseId);
        span.setAttribute("user.id", data.userId);

        const { enrolled } = await this._checkCourseEnrollmentUseCase.execute(
          data.courseId,
          data.userId,
        );
        return {
          enrolled,
        };
      },
    );
  }

  // @GrpcMethod("EnrollmentService", "UpdateEnrollment")
  // async updateEnrollment(
  //   data: UpdateEnrollmentRequest,
  //   metadata: Metadata
  // ): Promise<EnrollmentResponse> {
  //     return await this._tracer.startActiveSpan(
  //       "EnrollmentGrpcController.UpdateEnrollment",
  //       async (span) => {
  //         span.setAttribute("enrollment.id", data.enrollmentId);

  //         const enrollmentDto = await this.updateEnrollmentUseCase.execute(
  //           data.enrollmentId,
  //           EnrollmentStatus[data.status]
  //         );
  //         return {
  //           enrollment: enrollmentDto.toGrpcResponse(),
  //         };
  //       }
  //     );
  //   } catch (error: any) {
  //     this._logger.error(`Failed to update enrollment: ${error.message}`, {
  //       error,
  //     });

  //     if (error instanceof DomainException) {
  //       return {
  //         error: this.createErrorResponse(error),
  //       };
  //     }
  //     throw error;
  //   }
  // }

  @GrpcMethod("EnrollmentService", "DeleteEnrollment")
  async deleteEnrollment(
    data: DeleteEnrollmentRequest,
    metadata: Metadata,
  ): Promise<DeleteEnrollmentResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.DeleteEnrollment",
      async (span) => {
        span.setAttribute("enrollment.id", data.enrollmentId);

        await this._deleteEnrollmentUseCase.execute(data.enrollmentId);
        return { success: { deleted: true } };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetEnrollmentsByUser")
  async getEnrollmentsByUser(
    data: GetEnrollmentsByUserRequest,
    metadata: Metadata,
  ): Promise<EnrollmentsResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetEnrollmentsByUser",
      async (span) => {
        span.setAttribute("user.id", data.userId);

        const enrollments = await this._getEnrollmentsByUserUseCase.execute(
          data.userId,
        );
        return {
          enrollments: {
            enrollments: enrollments?.map((enrollment) =>
              EnrollmentMapper.toGrpcResponse(enrollment),
            ),
            total: 1,
          },
        };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetEnrollmentsByCourse")
  async getEnrollmentsByCourse(
    data: GetEnrollmentsByCourseRequest,
    metadata: Metadata,
  ): Promise<EnrollmentsResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetEnrollmentsByCourse",
      async (span) => {
        span.setAttribute("course.id", data.courseId);

        const enrollments = await this._getEnrollmentsByCourseUseCase.execute(
          data.courseId,
        );
        return {
          enrollments: {
            enrollments: enrollments?.map((enrollment) =>
              EnrollmentMapper.toGrpcResponse(enrollment),
            ),
            total: 1,
          },
        };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "GetInstructorCoursesEnrollmentSummery")
  async getInstructorCoursesEnrollmentSummery(
    data: GetInstructorCoursesEnrollmentSummeryRequest,
    _metadata: Metadata,
  ): Promise<GetInstructorCoursesEnrollmentSummeryResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetInstructorCoursesEnrollmentSummery",
      async (span) => {
        // Best practice: log and trace using existing data shape, avoid hardcoded/wrong field access
        span.setAttribute("instructor.id", data.instructorId);

        this._logger.log(
          `gRPC: Fetching enrollments summary for instructor ${data.instructorId}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const summary =
          await this._getInstructorCoursesEnrollmentSummeryUseCase.execute(
            data,
          );

        return {
          success: summary,
        };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "GetRevenueStats")
  async getRevenueStats(
    data: GetRevenueStatsRequest,
    _metadata: Metadata,
  ): Promise<GetRevenueStatsResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetRevenueStats",
      async (span) => {
        // Best practice: log and trace using existing data shape, avoid hardcoded/wrong field access
        span.setAttribute("year.id", data.year);

        this._logger.log(
          `gRPC: Fetching revenue stats  for year ${data.year}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const summary = await this._getRevenueStatsUseCase.execute(data);

        return {
          success: summary,
        };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetInstructorCourseEnrollmentSummery")
  async getInstructorCourseEnrollmentSummery(
    data: GetInstructorCourseEnrollmentSummeryRequest,
    _metadata: Metadata,
  ): Promise<GetInstructorCourseEnrollmentSummeryResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetInstructorCourseEnrollmentSummery",
      async (span) => {
        span.setAttribute("instructor.id", data.instructorId);
        span.setAttribute("course.id", data.courseId);

        this._logger.log(
          `gRPC: Fetching enrollment summary for course ${data.courseId}, instructor ${data.instructorId}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const summary =
          await this._getInstructorCourseEnrollmentSummeryUseCase.execute(data);

        return { success: summary };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetInstructorCourseEnrollmentTrend")
  async getInstructorCourseEnrollmentTrend(
    data: GetInstructorCourseEnrollmentTrendRequest,
    _metadata: Metadata,
  ): Promise<GetInstructorCourseEnrollmentTrendResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetInstructorCourseEnrollmentTrend",
      async (span) => {
        span.setAttribute("course.id", data.courseId);

        this._logger.log(
          `gRPC: Fetching enrollment trend for course ${data.courseId}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const trend =
          await this._getInstructorCourseEnrollmentTrendUseCase.execute(data);

        return { success: trend };
      },
    );
  }
  @GrpcMethod("EnrollmentService", "GetEnrollmentTrend")
  async getEnrollmentTrend(
    data: GetEnrollmentTrendRequest,
    _metadata: Metadata,
  ): Promise<GetEnrollmentTrendResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetEnrollmentTrend",
      async (span) => {
        span.setAttribute("year", data.year);

        this._logger.log(
          `gRPC: Fetching enrollment trend for year ${data.year}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const trend = await this._getEnrollmentTrendUseCase.execute(data);
        console.log("Enrollment Trend", JSON.stringify(trend, null, 2));

        return { success: trend };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetMonthlyCoursesEnrollmentStats")
  async getMonthlyCoursesEnrollmentStats(
    data: GetMonthlyCoursesEnrollmentStatsRequest,
    _metadata: Metadata,
  ): Promise<GetMonthlyCoursesEnrollmentStatsResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetMonthlyCoursesEnrollmentStats",
      async (span) => {
        span.setAttribute("year", data.year);

        this._logger.log(
          `gRPC: Fetching monthly courses enrollment stats for year ${data.year}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const stats =
          await this._getMonthlyCoursesEnrollmentStatsUseCase.execute(data);

        return { success: stats };
      },
    );
  }

  @GrpcMethod("EnrollmentService", "GetInstructorCourseRevenueSummery")
  async getInstructorCourseRevenueSummery(
    data: GetInstructorCourseRevenueSummeryRequest,
    _metadata: Metadata,
  ): Promise<GetInstructorCourseRevenueSummeryResponse> {
    return await this._tracer.startActiveSpan(
      "EnrollmentGrpcController.GetInstructorCourseRevenueSummery",
      async (span) => {
        span.setAttribute("instructor.id", data.instructorId);
        span.setAttribute("course.id", data.courseId);

        this._logger.log(
          `gRPC: Fetching revenue summary for course ${data.courseId}, instructor ${data.instructorId}`,
          { ctx: EnrollmentGrpcController.name },
        );

        const summary =
          await this._getInstructorCourseRevenueSummeryUseCase.execute(data);

        return { success: summary };
      },
    );
  }
}
