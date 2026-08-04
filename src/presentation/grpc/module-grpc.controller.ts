import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { ICreateModuleUseCase } from "src/application/use-cases/module/interfaces/create-module.interface";
import { IGetModuleUseCase } from "src/application/use-cases/module/interfaces/get-module.interface";
import { IUpdateModuleUseCase } from "src/application/use-cases/module/interfaces/update-module.interface";
import { IDeleteModuleUseCase } from "src/application/use-cases/module/interfaces/delete-module.interface";
import { CreateModuleRequestDto } from "./dtos/module/create-module.dto";
import { GetModuleRequestDto } from "./dtos/module/get-module.dto";
import { IGetModulesByCourseUseCase } from "src/application/use-cases/module/interfaces/get-modules-by-course.interface";
import {
  DeleteModuleResponse,
  GetModulesByCourseRequest,
  ModuleResponse,
  ModulesResponse,
  UpdateModuleRequest,
} from "src/infrastructure/grpc/generated/course/types/module";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { DeleteModuleDto } from "./dtos/module/delete-module.dto";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class ModuleGrpcController {
  constructor(
    private readonly _createModuleUseCase: ICreateModuleUseCase,
    private readonly _getModuleUseCase: IGetModuleUseCase,
    private readonly _getModulesByCourseUseCase: IGetModulesByCourseUseCase,
    private readonly _updateModuleUseCase: IUpdateModuleUseCase,
    private readonly _deleteModuleUseCase: IDeleteModuleUseCase,
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

  @GrpcMethod("CourseService", "CreateModule")
  async createModule(
    data: CreateModuleRequestDto,
    metadata: Metadata,
  ): Promise<ModuleResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "ModuleGrpcController.CreateModule",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this._logger.log(
            `gRPC: Creating module for courseID ${data.courseId}`,
            { ctx: ModuleGrpcController.name },
          );
          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const moduleDto = await this._createModuleUseCase.execute(
            data,
            idempotencyKey,
          );
          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create module: ${error.message}`, {
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
      return await this._tracer.startActiveSpan(
        "ModuleGrpcController.GetModule",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("module.id", data.moduleId);
          this._logger.log(
            `gRPC: Fetching module for courseID ${data.courseId}`,
            { ctx: ModuleGrpcController.name },
          );

          const moduleDto = await this._getModuleUseCase.execute(data.moduleId);

          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get module: ${error.message}`, {
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
      return await this._tracer.startActiveSpan(
        "ModuleGrpcController.UpdateModule",
        async (span) => {
          span.setAttribute("course.module.id", data.moduleId);
          this._logger.log(`gRPC: Updating module  ${data.moduleId}`, {
            ctx: ModuleGrpcController.name,
          });

          const moduleDto = await this._updateModuleUseCase.execute(data);

          return {
            module: moduleDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update module: ${error.message}`, {
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
      return await this._tracer.startActiveSpan(
        "ModuleGrpcController.DeleteModule",
        async (span) => {
          span.setAttribute("module.id", data.moduleId);
          this._logger.log(`gRPC: Deleting module  ${data.moduleId}`, {
            ctx: ModuleGrpcController.name,
          });

          await this._deleteModuleUseCase.execute(data);

          return { success: { deleted: true } };
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete module: ${error.message}`, {
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
      return await this._tracer.startActiveSpan(
        "ModuleGrpcController.GetModulesByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this._logger.log(`gRPC: Fetching modules `, {
            ctx: ModuleGrpcController.name,
          });

          const modules = await this._getModulesByCourseUseCase.execute(
            data.courseId,
          );

          return {
            modules: {
              modules: modules.map((module) => module.toGrpcResponse()),
            },
          } as ModulesResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get modules by course: ${error.message}`, {
        error,
      });

      throw error;
    }
  }
}
