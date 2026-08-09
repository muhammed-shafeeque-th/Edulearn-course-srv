import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import {
  DeleteLessonRequest,
  DeleteLessonResponse,
  GetLessonRequest,
  GetLessonsByModuleRequest,
  LessonResponse,
  LessonsResponse,
} from "src/infrastructure/grpc/generated/course/types/lesson";
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
import { LessonMapper } from "../mappers/lesson.mapper";

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

        const lesson = await this._createLessonUseCase.execute(
          data,
          idempotencyKey,
        );
        return {
          lesson: LessonMapper.toGrpcResponse(lesson),
        };
      },
    );
  }

  @GrpcMethod("CourseService", "GetLesson")
  async getLesson(
    data: GetLessonRequest,
    metadata: Metadata,
  ): Promise<LessonResponse> {
    return await this._tracer.startActiveSpan(
      "LessonGrpcController.GetLesson",
      async (span) => {
        span.setAttribute("lesson.id", data.lessonId);
        this._logger.log(`gRPC: Fetching lesson for module ${data.lessonId}`, {
          ctx: LessonGrpcController.name,
        });

        const lesson = await this._getLessonUseCase.execute(data.lessonId);
        return { lesson: LessonMapper.toGrpcResponse(lesson) };
      },
    );
  }

  @GrpcMethod("CourseService", "UpdateLesson")
  async updateLesson(
    data: UpdateLessonDto,
    metadata: Metadata,
  ): Promise<LessonResponse> {
    return await this._tracer.startActiveSpan(
      "LessonGrpcController.UpdateLesson",
      async (span) => {
        span.setAttribute("lesson.id", data.lessonId);

        const lesson = await this._updateLessonUseCase.execute(data);
        return {
          lesson: LessonMapper.toGrpcResponse(lesson),
        };
      },
    );
  }

  @GrpcMethod("CourseService", "DeleteLesson")
  async deleteLesson(
    data: DeleteLessonRequest,
    metadata: Metadata,
  ): Promise<DeleteLessonResponse> {
    return await this._tracer.startActiveSpan(
      "LessonGrpcController.DeleteLesson",
      async (span) => {
        span.setAttribute("lesson.id", data.lessonId);

        await this._deleteLessonUseCase.execute(data);
        return { success: { deleted: true } };
      },
    );
  }

  @GrpcMethod("CourseService", "GetLessonsByModule")
  async getLessonsByModule(
    data: GetLessonsByModuleRequest,
    metadata: Metadata,
  ): Promise<LessonsResponse> {
    return await this._tracer.startActiveSpan(
      "LessonGrpcController.GetLessonsByModule",
      async (span) => {
        span.setAttribute("module.id", data.moduleId);

        const lessons = await this._getLessonsByModuleUseCase.execute(
          data.moduleId,
        );
        return {
          lessons: {
            lessons: lessons?.map((lesson) =>
              LessonMapper.toGrpcResponse(lesson),
            ),
          },
        } as LessonsResponse;
      },
    );
  }
}
