import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { AddReviewUseCase } from "src/application/use-cases/review/add-review.use-case";
import { GetReviewUseCase } from "src/application/use-cases/review/get-review.use-case";
import { GetReviewsByCourseUseCase } from "src/application/use-cases/review/get-reviews-by-course.use-case";
import { UpdateReviewUseCase } from "src/application/use-cases/review/update-review.use-case";
import { DeleteReviewUseCase } from "src/application/use-cases/review/delete-review.use-case";
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
import { GetReviewByEnrollmentUseCase } from "src/application/use-cases/review/get-review-by-enrollment.use-case";

@Controller()
export class ReviewGrpcController {
  constructor(
    private readonly createReviewUseCase: AddReviewUseCase,
    private readonly getReviewUseCase: GetReviewUseCase,
    private readonly getReviewByEnrollmentUseCase: GetReviewByEnrollmentUseCase,
    private readonly getReviewsByCourseUseCase: GetReviewsByCourseUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

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

  // Review CRUD
  @GrpcMethod("EnrollmentService", "SubmitCourseReview")
  async createReview(
    data: SubmitCourseReviewRequest,
    metadata: Metadata
  ): Promise<ReviewResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.SubmitCourseReview",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);


          const reviewDto = await this.createReviewUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create review: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "GetReview")
  async getReview(
    data: GetReviewRequest,
    metadata: Metadata
  ): Promise<ReviewResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.GetReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          const reviewDto = await this.getReviewUseCase.execute(data.reviewId);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get review: ${error.message}`, {
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
  @GrpcMethod("EnrollmentService", "GetReviewByEnrollment")
  async getReviewByEnrollment(
    data: GetReviewByEnrollmentRequest,
    metadata: Metadata
  ): Promise<ReviewResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.GetReviewByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const reviewDto =
            await this.getReviewByEnrollmentUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get review: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "UpdateReview")
  async updateReview(
    data: UpdateReviewRequest,
    metadata: Metadata
  ): Promise<ReviewResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.UpdateReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          const reviewDto = await this.updateReviewUseCase.execute(data);
          return {
            review: reviewDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update review: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "DeleteReview")
  async deleteReview(
    data: DeleteReviewRequest,
    metadata: Metadata
  ): Promise<DeleteReviewResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.DeleteReview",
        async (span) => {
          span.setAttribute("review.id", data.reviewId);

          await this.deleteReviewUseCase.execute(data);
          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete review: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "GetReviewsByCourse")
  async getReviewsByCourse(
    data: GetReviewsByCourseRequest,
    metadata: Metadata
  ): Promise<ReviewsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ReviewGrpcController.GetReviewsByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("page", data.pagination?.page);
          span.setAttribute("pageSize", data.pagination?.pageSize);
          span.setAttribute("sortBy", data.pagination?.sortBy);
          span.setAttribute("sortOrder", data.pagination?.sortOrder);

          const { reviews, total } =
            await this.getReviewsByCourseUseCase.execute(
              data.courseId,
              data.pagination?.page,
              data.pagination?.pageSize,
              data.pagination?.sortBy,
              (data.pagination?.sortOrder as any) || "DESC"
            );
          return {
            reviews: {
              reviews: reviews.map((review) => review.toGrpcResponse()),
              total,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get reviews by course: ${error.message}`, {
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
}
