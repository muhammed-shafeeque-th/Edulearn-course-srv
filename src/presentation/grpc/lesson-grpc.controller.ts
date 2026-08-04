import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import {
  ContentMetaData,
  DeleteLessonRequest,
  DeleteLessonResponse,
  GetLessonRequest,
  GetLessonsByModuleRequest,
  LessonData,
  LessonResponse,
  LessonsResponse,
} from "src/infrastructure/grpc/generated/course/types/lesson";
import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { UpdateLessonDto } from "./dtos/lesson/update-lesson.dto";
import { CreateLessonDto } from "./dtos/lesson/create-lesson.dto";
import { IGetLessonsByModuleUseCase } from "src/application/use-cases/lesson/interfaces/get-lessons-by-modules.interface";
import { ICreateLessonUseCase } from "src/application/use-cases/lesson/interfaces/create-lesson.interface";
import { IGetLessonUseCase } from "src/application/use-cases/lesson/interfaces/get-lesson.interface";
import { IUpdateLessonUseCase } from "src/application/use-cases/lesson/interfaces/update-leson.interface";
import { IDeleteLessonUseCase } from "src/application/use-cases/lesson/interfaces/delete-lesson.interface";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class LessonGrpcController {
  constructor(
    private readonly _createLessonUseCase: ICreateLessonUseCase,
    private readonly _getLessonUseCase: IGetLessonUseCase,
    private readonly _getLessonsByModuleUseCase: IGetLessonsByModuleUseCase,
    private readonly _updateLessonUseCase: IUpdateLessonUseCase,
    private readonly _deleteLessonUseCase: IDeleteLessonUseCase,
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

  // Lesson CRUD
  @GrpcMethod("CourseService", "CreateLesson")
  async createLesson(
    data: CreateLessonDto,
    metadata: Metadata,
  ): Promise<LessonResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "LessonGrpcController.CreateLesson",
        async (span) => {
          span.setAttribute("module.id", data.moduleId);
          this._logger.log(
            `gRPC: Creating lesson for moduleId ${data.moduleId}`,
            { ctx: LessonGrpcController.name },
          );

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const lessonDto = await this._createLessonUseCase.execute(
            data,
            idempotencyKey,
          );
          return {
            lesson: lessonDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create lesson: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetLesson")
  async getLesson(
    data: GetLessonRequest,
    metadata: Metadata,
  ): Promise<LessonResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "LessonGrpcController.GetLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);
          this._logger.log(`gRPC: Fetching lesson for module ${data.lessonId}`, {
            ctx: LessonGrpcController.name,
          });

          const lessonDto = await this._getLessonUseCase.execute(data.lessonId);
          return { lesson: lessonDto.toGrpcResponse() };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get lesson: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "UpdateLesson")
  async updateLesson(
    data: UpdateLessonDto,
    metadata: Metadata,
  ): Promise<LessonResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "LessonGrpcController.UpdateLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);

          const lessonDto = await this._updateLessonUseCase.execute(data);
          return {
            lesson: lessonDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update lesson: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteLesson")
  async deleteLesson(
    data: DeleteLessonRequest,
    metadata: Metadata,
  ): Promise<DeleteLessonResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "LessonGrpcController.DeleteLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);

          await this._deleteLessonUseCase.execute(data);
          return { success: { deleted: true } };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete lesson: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "GetLessonsByModule")
  async getLessonsByModule(
    data: GetLessonsByModuleRequest,
    metadata: Metadata,
  ): Promise<LessonsResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "LessonGrpcController.GetLessonsByModule",
        async (span) => {
          span.setAttribute("module.id", data.moduleId);

          const lessons = await this._getLessonsByModuleUseCase.execute(
            data.moduleId,
          );
          return {
            lessons: {
              lessons: lessons?.map((lesson) => lesson.toGrpcResponse()),
            },
          } as LessonsResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get lessons by module: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
}
