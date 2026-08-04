import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { Metadata } from "@grpc/grpc-js";

import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";

import { ICreateCategoryUseCase } from "src/application/use-cases/category/interfaces/create-category.interface";
import { IUpdateCategoryUseCase } from "src/application/use-cases/category/interfaces/update-category.interface";
import { IDeleteCategoryUseCase } from "src/application/use-cases/category/interfaces/delete-category.interface";
import { IGetAllCategoriesUseCase } from "src/application/use-cases/category/interfaces/get-all-categories.interface";
import { IToggleCategoryStatusUseCase } from "src/application/use-cases/category/interfaces/toggle-category-status.interface";
import { getMetadataValues } from "src/shared/utils/get-metadata";

import {
  CategoriesResponse,
  CategoryResponse,
  CreateCategoryRequest,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  GetAllCategoriesRequest,
  GetCategoriesStatsRequest,
  GetCategoriesStatsResponse,
  ToggleCategoryStatusRequest,
  UpdateCategoryRequest,
} from "src/infrastructure/grpc/generated/course/types/category";
import { IGetCategoriesStatsUseCase } from "src/application/use-cases/category/interfaces/get-categories-stats.interface";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class CategoryGrpcController {
  constructor(
    private readonly _createCategoryUseCase: ICreateCategoryUseCase,
    private readonly _updateCategoryUseCase: IUpdateCategoryUseCase,
    private readonly _deleteCategoryUseCase: IDeleteCategoryUseCase,
    private readonly _getAllCategoriesUseCase: IGetAllCategoriesUseCase,
    private readonly _getCategoriesStatsUseCase: IGetCategoriesStatsUseCase,
    private readonly _toggleCategoryStatusUseCase: IToggleCategoryStatusUseCase,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  @GrpcMethod("CourseService", "GetAllCategories")
  async getAllCategories(
    data: GetAllCategoriesRequest,
    metadata: Metadata,
  ): Promise<CategoriesResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.GetAllCategories",
        async (span) => {
          this._logger.debug("gRPC: Fetching all categories", {
            ctx: CategoryGrpcController.name,
          });

          const categoriesDto = await this._getAllCategoriesUseCase.execute({
            includeDeleted: data.includeDeleted,
            activeOnly: data.activeOnly,
          });

          return {
            categories: {
              categories: categoriesDto.map((c) => c.toGrpcResponse()),
              total: categoriesDto.length,
            },
          } as CategoriesResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get all categories: ${error.message}`, {
        error,
      });
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetCategoriesStats")
  async getCategoriesStats(
    data: GetCategoriesStatsRequest,
    metadata: Metadata,
  ): Promise<CategoriesResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.GetCategoriesStats",
        async (span) => {
          this._logger.debug("gRPC: Fetching all categories", {
            ctx: CategoryGrpcController.name,
          });

          const stats = await this._getCategoriesStatsUseCase.execute(data);

          return {
            stats,
          } as GetCategoriesStatsResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to get all categories: ${error.message}`, {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("CourseService", "CreateCategory")
  async createCategory(
    data: CreateCategoryRequest,
    metadata: Metadata,
  ): Promise<CategoryResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.CreateCategory",
        async (span) => {
          this._logger.debug(`gRPC: Creating category ${data.name}`, {
            ctx: CategoryGrpcController.name,
          });

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const categoryDto = await this._createCategoryUseCase.execute(
            data,
            idempotencyKey,
          );

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to create category: ${error.message}`, {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("CourseService", "UpdateCategory")
  async updateCategory(
    data: UpdateCategoryRequest,
    metadata: Metadata,
  ): Promise<CategoryResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.UpdateCategory",
        async (span) => {
          this._logger.debug(`gRPC: Updating category ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          const categoryDto = await this._updateCategoryUseCase.execute(data);

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to update category: ${error.message}`, {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteCategory")
  async deleteCategory(
    data: DeleteCategoryRequest,
    metadata: Metadata,
  ): Promise<DeleteCategoryResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.DeleteCategory",
        async (span) => {
          this._logger.debug(`gRPC: Deleting category ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          await this._deleteCategoryUseCase.execute(data.id);

          return {
            success: { deleted: true },
          } as DeleteCategoryResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to delete category: ${error.message}`, {
        error,
      });
      throw error;
    }
  }

  @GrpcMethod("CourseService", "ToggleCategoryStatus")
  async toggleCategoryStatus(
    data: ToggleCategoryStatusRequest,
    metadata: Metadata,
  ): Promise<CategoryResponse> {
    try {
      return await this._tracer.startActiveSpan(
        "CategoryGrpcController.ToggleCategoryStatus",
        async (span) => {
          this._logger.debug(`gRPC: Toggling category status ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          const categoryDto = await this._toggleCategoryStatusUseCase.execute(
            data.id,
          );

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error: any) {
      this._logger.error(`Failed to toggle category status: ${error.message}`, {
        error,
      });
      throw error;
    }
  }
}
