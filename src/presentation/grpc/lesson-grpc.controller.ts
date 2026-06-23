import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import {
  ContentMetaData,
  DeleteLessonRequest,
  DeleteLessonResponse,
  GetLessonRequest,
  GetLessonsBySectionRequest,
  LessonData,
  LessonResponse,
  LessonsResponse,
} from "src/infrastructure/grpc/generated/course/types/lesson";
import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { UpdateLessonDto } from "./dtos/lesson/update-lesson.dto";
import { CreateLessonDto } from "./dtos/lesson/create-lesson.dto";
import { GetLessonsBySectionUseCase } from "src/application/use-cases/lesson/get-lessons-by-sections.use-case";
import { CreateLessonUseCase } from "src/application/use-cases/lesson/create-lesson.use-case";
import { GetLessonUseCase } from "src/application/use-cases/lesson/get-lesson.use-case";
import { UpdateLessonUseCase } from "src/application/use-cases/lesson/update-leson.use-case";
import { DeleteLessonUseCase } from "src/application/use-cases/lesson/delete-lesson.use-case";

@Controller()
export class LessonGrpcController {
  constructor(
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly getLessonUseCase: GetLessonUseCase,
    private readonly getLessonsBySectionUseCase: GetLessonsBySectionUseCase,
    private readonly updateLessonUseCase: UpdateLessonUseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
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

  // Lesson CRUD
  @GrpcMethod("CourseService", "CreateLesson")
  async createLesson(
    data: CreateLessonDto,
    metadata: Metadata
  ): Promise<LessonResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "LessonGrpcController.CreateLesson",
        async (span) => {
          span.setAttribute("section.id", data.sectionId);
          this.logger.log(
            `gRPC: Creating lesson for sectionId ${data.sectionId}`,
            { ctx: LessonGrpcController.name }
          );

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const lessonDto = await this.createLessonUseCase.execute(
            data,
            idempotencyKey
          );
          return {
            lesson: lessonDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create lesson: ${error.message}`, {
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

  @GrpcMethod("CourseService", "GetLesson")
  async getLesson(
    data: GetLessonRequest,
    metadata: Metadata
  ): Promise<LessonResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "LessonGrpcController.GetLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);
          this.logger.log(
            `gRPC: Fetching lesson for section ${data.lessonId}`,
            {
              ctx: LessonGrpcController.name,
            }
          );

          const lessonDto = await this.getLessonUseCase.execute(data.lessonId);
          return { lesson: lessonDto.toGrpcResponse() };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get lesson: ${error.message}`, {
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

  @GrpcMethod("CourseService", "UpdateLesson")
  async updateLesson(
    data: UpdateLessonDto,
    metadata: Metadata
  ): Promise<LessonResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "LessonGrpcController.UpdateLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);

          const lessonDto = await this.updateLessonUseCase.execute(data);
          return {
            lesson: lessonDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update lesson: ${error.message}`, {
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

  @GrpcMethod("CourseService", "DeleteLesson")
  async deleteLesson(
    data: DeleteLessonRequest,
    metadata: Metadata
  ): Promise<DeleteLessonResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "LessonGrpcController.DeleteLesson",
        async (span) => {
          span.setAttribute("lesson.id", data.lessonId);

          await this.deleteLessonUseCase.execute(data);
          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete lesson: ${error.message}`, {
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

  @GrpcMethod("CourseService", "GetLessonsBySection")
  async getLessonsBySection(
    data: GetLessonsBySectionRequest,
    metadata: Metadata
  ): Promise<LessonsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "LessonGrpcController.GetLessonsBySection",
        async (span) => {
          span.setAttribute("section.id", data.sectionId);

          const lessons = await this.getLessonsBySectionUseCase.execute(
            data.sectionId
          );
          return {
            lessons: {
              lessons: lessons?.map((lesson) => lesson.toGrpcResponse()),
            },
          } as LessonsResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get lessons by section: ${error.message}`, {
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
