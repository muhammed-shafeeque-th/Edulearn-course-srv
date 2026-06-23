import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { CreateModuleUseCase } from "src/application/use-cases/module/create-module.use-case";
import { ModuleDto } from "src/application/dtos/module.dto";
import { GetModuleUseCase } from "src/application/use-cases/module/get-module.use-case";
import { UpdateModuleUseCase } from "src/application/use-cases/module/update-module.use-case";
import { DeleteModuleUseCase } from "src/application/use-cases/module/delete-module.use-case";
import { CreateModuleRequestDto } from "./dtos/module/create-module.dto";
import { GetModuleRequestDto } from "./dtos/module/get-module.dto";
import { GetModulesByCourseUseCase } from "src/application/use-cases/module/get-modules-by-course.use-case";
import {
  ContentMetaData,
  LessonData,
} from "src/infrastructure/grpc/generated/course/types/lesson";
import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { QuizDto } from "src/application/dtos/quiz.dto";
import {
  DeleteModuleRequest,
  DeleteModuleResponse,
  GetModulesByCourseRequest,
  ModuleData,
  ModuleResponse,
  ModulesResponse,
  UpdateModuleRequest,
} from "src/infrastructure/grpc/generated/course/types/module";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { DeleteModuleDto } from "./dtos/module/delete-module.dto";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class ModuleGrpcController {
  constructor(
    private readonly createModuleUseCase: CreateModuleUseCase,
    private readonly getModuleUseCase: GetModuleUseCase,
    private readonly getModulesByCourseUseCase: GetModulesByCourseUseCase,
    private readonly updateModuleUseCase: UpdateModuleUseCase,
    private readonly deleteModuleUseCase: DeleteModuleUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
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

  @GrpcMethod("CourseService", "CreateModule")
  async createModule(
    data: CreateModuleRequestDto,
    metadata: Metadata,
  ): Promise<ModuleResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ModuleGrpcController.CreateModule",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(
            `gRPC: Creating module for courseID ${data.courseId}`,
            { ctx: ModuleGrpcController.name },
          );
          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const moduleDto = await this.createModuleUseCase.execute(
            data,
            idempotencyKey,
          );
          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error) {
      this.logger.error(`Failed to create module: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetModule")
  async getModule(
    data: GetModuleRequestDto,
    metadata: Metadata,
  ): Promise<ModuleResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ModuleGrpcController.GetModule",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("module.id", data.moduleId);
          this.logger.log(
            `gRPC: Fetching module for courseID ${data.courseId}`,
            { ctx: ModuleGrpcController.name },
          );

          const moduleDto = await this.getModuleUseCase.execute(data.moduleId);

          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error) {
      this.logger.error(`Failed to get module: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "UpdateModule")
  async updateModule(
    data: UpdateModuleRequest,
    metadata: Metadata,
  ): Promise<ModuleResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ModuleGrpcController.UpdateModule",
        async (span) => {
          span.setAttribute("course.module.id", data.moduleId);
          this.logger.log(`gRPC: Updating module  ${data.moduleId}`, {
            ctx: ModuleGrpcController.name,
          });

          const moduleDto = await this.updateModuleUseCase.execute(data);

          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error) {
      this.logger.error(`Failed to update module: ${error.message}`, {
        error,
      });

      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteModule")
  async deleteModule(
    data: DeleteModuleDto,
    metadata: Metadata,
  ): Promise<DeleteModuleResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ModuleGrpcController.DeleteModule",
        async (span) => {
          span.setAttribute("module.id", data.moduleId);
          this.logger.log(`gRPC: Deleting module  ${data.moduleId}`, {
            ctx: ModuleGrpcController.name,
          });

          await this.deleteModuleUseCase.execute(data);

          return { success: { deleted: true } };
        },
      );
    } catch (error) {
      this.logger.error(`Failed to delete module: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetModulesByCourse")
  async getModulesByCourse(
    data: GetModulesByCourseRequest,
    metadata: Metadata,
  ): Promise<ModulesResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "ModuleGrpcController.GetModulesByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(`gRPC: Fetching modules `, {
            ctx: ModuleGrpcController.name,
          });

          const modules = await this.getModulesByCourseUseCase.execute(
            data.courseId,
          );

          return {
            modules: {
              modules: modules.map((module) => module.toGrpcResponse()),
            },
          } as ModulesResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to get modules by course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
}
