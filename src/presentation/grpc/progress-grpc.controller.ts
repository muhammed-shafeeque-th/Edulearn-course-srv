import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { ICreateProgressUseCase } from "src/application/use-cases/progress/interfaces/create-progress.interface";
import { IGetProgressUseCase } from "src/application/use-cases/progress/interfaces/get-progress.interface";
import { IGetProgressesByEnrollmentUseCase } from "src/application/use-cases/progress/interfaces/get-progress-by-enrollment.interface";
import { IUpdateProgressUseCase } from "src/application/use-cases/progress/interfaces/update-progress.interface";
import { IDeleteProgressUseCase } from "src/application/use-cases/progress/interfaces/delete-progress.interface";
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
import { IUpdateLessonProgressUseCase } from "src/application/use-cases/progress/interfaces/update-lesson-progress.interface";
import { ISubmitQuizAttemptUseCase } from "src/application/use-cases/progress/interfaces/submit-quiz-attempt.interface";
import { IGetEnrollmentProgressUseCase } from "src/application/use-cases/progress/interfaces/get-enrollment-progress.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class ProgressGrpcController {
  constructor(
    private readonly _createProgressUseCase: ICreateProgressUseCase,
    private readonly _getProgressUseCase: IGetProgressUseCase,
    private readonly _getEnrollmentProgressesUseCase: IGetEnrollmentProgressUseCase,
    private readonly _updateLessonProgressUseCase: IUpdateLessonProgressUseCase,
    private readonly _submitQuizAttemptUseCase: ISubmitQuizAttemptUseCase,
    private readonly _deleteProgressUseCase: IDeleteProgressUseCase,
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

  // Progress CRUD
  @GrpcMethod("EnrollmentService", "CreateProgress")
  async createProgress(
    data: CreateProgressRequest,
    metadata: Metadata,
  ): Promise<ProgressResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.CreateProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const progressDto = await this._createProgressUseCase.execute(
            data.enrollmentId,
            data.lessonId,
          );
          return {
            progress: progressDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create progress: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetProgress")
  async getProgress(
    data: GetProgressRequest,
    metadata: Metadata,
  ): Promise<ProgressResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.GetProgress",
        async (span) => {
          span.setAttribute("progress.id", data.progressId);

          const progressDto = await this._getProgressUseCase.execute(
            data.progressId,
          );
          return {
            progress: progressDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get progress: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "UpdateLessonProgress")
  async updateProgress(
    data: UpdateLessonProgressRequest,
    metadata: Metadata,
  ): Promise<UpdateLessonProgressResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.UpdateLessonProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("lesson.id", data.lessonId);

          const progressResponse =
            await this._updateLessonProgressUseCase.execute({
              currentTime: data.currentTime,
              duration: data.duration,
              enrollmentId: data.enrollmentId,
              event: data.event as any,
              lessonId: data.lessonId,
            });
          return {
            progress: progressResponse,
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update lesson progress: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("EnrollmentService", "SubmitQuizProgress")
  async submitQuizProgress(
    data: SubmitQuizAttemptRequest,
    metadata: Metadata,
  ): Promise<SubmitQuizAttemptResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.SubmitQuizProgress",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("quiz.id", data.quizId);

          const progressResponse =
            await this._submitQuizAttemptUseCase.execute(data);
          return {
            progress: progressResponse,
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to submit quiz attempt: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "DeleteProgress")
  async deleteProgress(
    data: DeleteProgressRequest,
    metadata: Metadata,
  ): Promise<DeleteProgressResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.DeleteProgress",
        async (span) => {
          span.setAttribute("progress.id", data.progressId);

          await this._deleteProgressUseCase.execute(data.progressId);
          return { success: { deleted: true } };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete progress: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetProgressByEnrollment")
  async getProgressByEnrollment(
    data: GetProgressByEnrollmentRequest,
    metadata: Metadata,
  ): Promise<EnrollmentProgressResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ProgressGrpcController.GetProgressByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);
          span.setAttribute("user.id", data.userId);

          const progressResponse =
            await this._getEnrollmentProgressesUseCase.execute(data);
          return {
            progress: progressResponse,
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `Failed to get progress by enrollment: ${error.message}`,
        { error },
      );

      throw error;
    }
  }
}
