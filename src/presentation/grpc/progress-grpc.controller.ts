import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { CreateProgressUseCase } from "src/application/use-cases/progress/create-progress.user-case";
import { GetProgressUseCase } from "src/application/use-cases/progress/get-progress.use-case";
import { GetProgressesByEnrollmentUseCase } from "src/application/use-cases/progress/get-progress-by-enrollment.use-case";
import { UpdateProgressUseCase } from "src/application/use-cases/progress/update-progress.use-case";
import { DeleteProgressUseCase } from "src/application/use-cases/progress/delete-progress.use-case";
import {
  CreateProgressRequest,
  DeleteProgressRequest,
  DeleteProgressResponse,
  EnrollmentProgressResponse,
  GetProgressByEnrollmentRequest,
  GetProgressRequest,
  ProgressData,
  ProgressesResponse,
  ProgressResponse,
  SubmitQuizAttemptRequest,
  SubmitQuizAttemptResponse,
  UpdateLessonProgressRequest,
  UpdateLessonProgressResponse,
  UpdateProgressRequest,
} from "src/infrastructure/grpc/generated/course/types/progress";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { UpdateLessonProgressUseCase } from "src/application/use-cases/progress/update-lesson-progress.use-case";
import { SubmitQuizAttemptUseCase } from "src/application/use-cases/progress/submit-quiz-attempt.use-case";
import { GetEnrollmentProgressUseCase } from "src/application/use-cases/progress/get-enrollment-progress.use-case";

@Controller()
export class ProgressGrpcController {
  constructor(
    private readonly createProgressUseCase: CreateProgressUseCase,
    private readonly getProgressUseCase: GetProgressUseCase,
    private readonly getEnrollmentProgressesUseCase: GetEnrollmentProgressUseCase,
    private readonly updateLessonProgressUseCase: UpdateLessonProgressUseCase,
    private readonly submitQuizAttemptUseCase: SubmitQuizAttemptUseCase,
    private readonly deleteProgressUseCase: DeleteProgressUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:  "serializeError" in error && typeof error.serializeError === "function"
      ? error.serializeError()
      : [{ message: error.message }],
    };
  }

  // Progress CRUD
  @GrpcMethod("EnrollmentService", "CreateProgress")
  async createProgress(
    data: CreateProgressRequest,
    metadata: Metadata
  ): Promise<ProgressResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.CreateProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const progressDto = await this.createProgressUseCase.execute(
            data.enrollmentId,
            data.lessonId
          );
          return {
            progress: progressDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create progress: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "GetProgress")
  async getProgress(
    data: GetProgressRequest,
    metadata: Metadata
  ): Promise<ProgressResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.GetProgress",
        async (span) => {
          span.setAttribute("progress.id", data.progressId);

          const progressDto = await this.getProgressUseCase.execute(
            data.progressId
          );
          return {
            progress: progressDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get progress: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "UpdateLessonProgress")
  async updateProgress(
    data: UpdateLessonProgressRequest,
    metadata: Metadata
  ): Promise<UpdateLessonProgressResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.UpdateLessonProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("lesson.id", data.lessonId);

          const progressResponse =
            await this.updateLessonProgressUseCase.execute({
              currentTime: data.currentTime,
              duration: data.duration,
              enrollmentId: data.enrollmentId,
              event: data.event as any,
              lessonId: data.lessonId,
            });
          return {
            progress: progressResponse,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update lesson progress: ${error.message}`, {
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
  @GrpcMethod("EnrollmentService", "SubmitQuizProgress")
  async submitQuizProgress(
    data: SubmitQuizAttemptRequest,
    metadata: Metadata
  ): Promise<SubmitQuizAttemptResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.SubmitQuizProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("quiz.id", data.quizId);

          const progressResponse =
            await this.submitQuizAttemptUseCase.execute(data);
          return {
            progress: progressResponse,
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to submit quiz attempt: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "DeleteProgress")
  async deleteProgress(
    data: DeleteProgressRequest,
    metadata: Metadata
  ): Promise<DeleteProgressResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.DeleteProgress",
        async (span) => {
          span.setAttribute("progress.id", data.progressId);

          await this.deleteProgressUseCase.execute(data.progressId);
          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete progress: ${error.message}`, {
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

  @GrpcMethod("EnrollmentService", "GetProgressByEnrollment")
  async getProgressByEnrollment(
    data: GetProgressByEnrollmentRequest,
    metadata: Metadata
  ): Promise<EnrollmentProgressResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ProgressGrpcController.GetProgressByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const progressResponse =
            await this.getEnrollmentProgressesUseCase.execute(data);
          return {
            progress: progressResponse,
          };
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to get progress by enrollment: ${error.message}`,
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
}
