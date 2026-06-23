import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import {
  DeleteQuizRequest,
  DeleteQuizResponse,
  GetQuizRequest,
  GetQuizzesByCourseRequest,
  QuizData,
  QuizResponse,
  QuizzesResponse,
} from "src/infrastructure/grpc/generated/course/types/quiz";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { CreateQuizUseCase } from "src/application/use-cases/quiz/create-quiz.use-case";
import { GetQuizUseCase } from "src/application/use-cases/quiz/get-quiz.use-case";
import { GetQuizzesByCourseUseCase } from "src/application/use-cases/quiz/get-quizes-by-course.use-case";
import { UpdateQuizUseCase } from "src/application/use-cases/quiz/update-quiz.use-case";
import { DeleteQuizUseCase } from "src/application/use-cases/quiz/delete-quiz.use-case";
import { CreateQuizDto } from "./dtos/quiz/create-quiz.dto";
import { UpdateQuizDto } from "./dtos/quiz/update-quiz.dto";

@Controller()
export class QuizGrpcController {
  constructor(
    private readonly createQuizUseCase: CreateQuizUseCase,
    private readonly getQuizUseCase: GetQuizUseCase,
    private readonly getQuizzesByCourseUseCase: GetQuizzesByCourseUseCase,
    private readonly updateQuizUseCase: UpdateQuizUseCase,
    private readonly deleteQuizUseCase: DeleteQuizUseCase,
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

  // Quiz CRUD
  @GrpcMethod("CourseService", "CreateQuiz")
  async createQuiz(
    data: CreateQuizDto,
    metadata: Metadata
  ): Promise<QuizResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "QuizGrpcController.CreateQuiz",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const quizDto = await this.createQuizUseCase.execute(
            data,
            idempotencyKey
          );
          return {
            quiz: quizDto.toGrpcResponse(),
          } as QuizResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create quiz: ${error.message}`, {
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

  @GrpcMethod("CourseService", "GetQuiz")
  async getQuiz(
    data: GetQuizRequest,
    metadata: Metadata
  ): Promise<QuizResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "QuizGrpcController.GetQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);

          const quizDto = await this.getQuizUseCase.execute(data.quizId);
          return {
            quiz: quizDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get quiz: ${error.message}`, { error });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "UpdateQuiz")
  async updateQuiz(
    data: UpdateQuizDto,
    metadata: Metadata
  ): Promise<QuizResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "QuizGrpcController.UpdateQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);
          span.setAttribute("quiz.title", data.title);

          const quizDto = await this.updateQuizUseCase.execute(data);
          return {
            quiz: quizDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update quiz: ${error.message}`, {
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

  @GrpcMethod("CourseService", "DeleteQuiz")
  async deleteQuiz(
    data: DeleteQuizRequest,
    metadata: Metadata
  ): Promise<DeleteQuizResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "QuizGrpcController.DeleteQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);

          await this.deleteQuizUseCase.execute(data);
          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete quiz: ${error.message}`, {
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

  @GrpcMethod("CourseService", "GetQuizzesByCourse")
  async getQuizzesByCourse(
    data: GetQuizzesByCourseRequest,
    metadata: Metadata
  ): Promise<QuizzesResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "QuizGrpcController.GetQuizzesByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          const quizzes = await this.getQuizzesByCourseUseCase.execute(
            data.courseId
          );
          return {
            quizzes: {
              quizzes: quizzes?.map((quiz) => quiz.toGrpcResponse()),
              total: 1,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get quizzes by course: ${error.message}`, {
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
