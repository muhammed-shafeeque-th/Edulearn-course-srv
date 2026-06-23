import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { IAddReviewUseCase } from "src/application/use-cases/review/interfaces/add-review.interface";
import { IGetReviewUseCase } from "src/application/use-cases/review/interfaces/get-review.interface";
import { IGetReviewsByCourseUseCase } from "src/application/use-cases/review/interfaces/get-reviews-by-course.interface";
import { IUpdateReviewUseCase } from "src/application/use-cases/review/interfaces/update-review.interface";
import { IDeleteReviewUseCase } from "src/application/use-cases/review/interfaces/delete-review.interface";
import {
  DeleteReviewRequest,
  DeleteReviewResponse,
  GetReviewByEnrollmentRequest,
  GetReviewRequest,
  GetReviewsByCourseRequest,
  ReviewResponse,
  ReviewsResponse,
  SubmitCourseReviewRequest,
  UpdateReviewRequest,
} from "src/infrastructure/grpc/generated/course/types/review";
import { IGetReviewByEnrollmentUseCase } from "src/application/use-cases/review/interfaces/get-review-by-enrollment.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class ReviewGrpcController {
  constructor(
    private readonly _createReviewUseCase: IAddReviewUseCase,
    private readonly _getReviewUseCase: IGetReviewUseCase,
    private readonly _getReviewByEnrollmentUseCase: IGetReviewByEnrollmentUseCase,
    private readonly _getReviewsByCourseUseCase: IGetReviewsByCourseUseCase,
    private readonly _updateReviewUseCase: IUpdateReviewUseCase,
    private readonly _deleteReviewUseCase: IDeleteReviewUseCase,
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

  // Review CRUD
  @GrpcMethod("EnrollmentService", "SubmitCourseReview")
  async createReview(
    data: SubmitCourseReviewRequest,
    metadata: Metadata,
  ): Promise<ReviewResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.SubmitCourseReview",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const reviewDto = await this._createReviewUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create review: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetReview")
  async getReview(
    data: GetReviewRequest,
    metadata: Metadata,
  ): Promise<ReviewResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.GetReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          const reviewDto = await this._getReviewUseCase.execute(data.reviewId);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get review: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "GetReviewByEnrollment")
  async getReviewByEnrollment(
    data: GetReviewByEnrollmentRequest,
    metadata: Metadata,
  ): Promise<ReviewResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.GetReviewByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const reviewDto =
            await this._getReviewByEnrollmentUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get review: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "UpdateReview")
  async updateReview(
    data: UpdateReviewRequest,
    metadata: Metadata,
  ): Promise<ReviewResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.UpdateReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          const reviewDto = await this._updateReviewUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update review: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "DeleteReview")
  async deleteReview(
    data: DeleteReviewRequest,
    metadata: Metadata,
  ): Promise<DeleteReviewResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.DeleteReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          await this._deleteReviewUseCase.execute(data);
          return { success: { deleted: true } };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete review: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetReviewsByCourse")
  async getReviewsByCourse(
    data: GetReviewsByCourseRequest,
    metadata: Metadata,
  ): Promise<ReviewsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ReviewGrpcController.GetReviewsByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("page", data.pagination?.page);
          span.setAttribute("pageSize", data.pagination?.pageSize);
          span.setAttribute("sortBy", data.pagination?.sortBy);
          span.setAttribute("sortOrder", data.pagination?.sortOrder);

          const { reviews, total } =
            await this._getReviewsByCourseUseCase.execute(
              data.courseId,
              data.pagination?.page,
              data.pagination?.pageSize,
              data.pagination?.sortBy,
              (data.pagination?.sortOrder as any) || "DESC",
            );
          return {
            reviews: {
              reviews: reviews.map((review) => review.toGrpcResponse()),
              total,
            },
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get reviews by course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
}
