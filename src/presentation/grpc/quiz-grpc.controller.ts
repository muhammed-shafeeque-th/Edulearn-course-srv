import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import {
  DeleteQuizRequest,
  DeleteQuizResponse,
  GetQuizRequest,
  GetQuizzesByCourseRequest,
  QuizResponse,
  QuizzesResponse,
} from "src/infrastructure/grpc/generated/course/types/quiz";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { ICreateQuizUseCase } from "src/application/use-cases/quiz/interfaces/create-quiz.interface";
import { IGetQuizUseCase } from "src/application/use-cases/quiz/interfaces/get-quiz.interface";
import { IGetQuizzesByCourseUseCase } from "src/application/use-cases/quiz/interfaces/get-quizes-by-course.interface";
import { IUpdateQuizUseCase } from "src/application/use-cases/quiz/interfaces/update-quiz.interface";
import { IDeleteQuizUseCase } from "src/application/use-cases/quiz/interfaces/delete-quiz.interface";
import { CreateQuizDto } from "./dtos/quiz/create-quiz.dto";
import { UpdateQuizDto } from "./dtos/quiz/update-quiz.dto";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class QuizGrpcController {
  constructor(
    private readonly _createQuizUseCase: ICreateQuizUseCase,
    private readonly _getQuizUseCase: IGetQuizUseCase,
    private readonly _getQuizzesByCourseUseCase: IGetQuizzesByCourseUseCase,
    private readonly _updateQuizUseCase: IUpdateQuizUseCase,
    private readonly _deleteQuizUseCase: IDeleteQuizUseCase,
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

  // Quiz CRUD
  @GrpcMethod("CourseService", "CreateQuiz")
  async createQuiz(
    data: CreateQuizDto,
    metadata: Metadata,
  ): Promise<QuizResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "QuizGrpcController.CreateQuiz",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const quizDto = await this._createQuizUseCase.execute(
            data,
            idempotencyKey,
          );
          return {
            quiz: quizDto.toGrpcResponse(),
          } as QuizResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create quiz: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetQuiz")
  async getQuiz(
    data: GetQuizRequest,
    metadata: Metadata,
  ): Promise<QuizResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "QuizGrpcController.GetQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);

          const quizDto = await this._getQuizUseCase.execute(data.quizId);
          return {
            quiz: quizDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get quiz: ${error.message}`, { error });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "UpdateQuiz")
  async updateQuiz(
    data: UpdateQuizDto,
    metadata: Metadata,
  ): Promise<QuizResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "QuizGrpcController.UpdateQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);
          span.setAttribute("quiz.title", data.title);

          const quizDto = await this._updateQuizUseCase.execute(data);
          return {
            quiz: quizDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update quiz: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteQuiz")
  async deleteQuiz(
    data: DeleteQuizRequest,
    metadata: Metadata,
  ): Promise<DeleteQuizResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "QuizGrpcController.DeleteQuiz",
        async (span) => {
          span.setAttribute("quiz.id", data.quizId);

          await this._deleteQuizUseCase.execute(data);
          return { success: { deleted: true } };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete quiz: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetQuizzesByCourse")
  async getQuizzesByCourse(
    data: GetQuizzesByCourseRequest,
    metadata: Metadata,
  ): Promise<QuizzesResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "QuizGrpcController.GetQuizzesByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);

          const quizzes = await this._getQuizzesByCourseUseCase.execute(
            data.courseId,
          );
          return {
            quizzes: {
              quizzes: quizzes?.map((quiz) => quiz.toGrpcResponse()),
              total: 1,
            },
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get quizzes by course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
}
