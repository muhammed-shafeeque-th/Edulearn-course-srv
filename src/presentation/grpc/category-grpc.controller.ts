import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { Metadata } from "@grpc/grpc-js";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";

import { CreateCategoryUseCase } from "src/application/use-cases/category/create-category.use-case";
import { UpdateCategoryUseCase } from "src/application/use-cases/category/update-category.use-case";
import { DeleteCategoryUseCase } from "src/application/use-cases/category/delete-category.use-case";
import { GetAllCategoriesUseCase } from "src/application/use-cases/category/get-all-categories.use-case";
import { ToggleCategoryStatusUseCase } from "src/application/use-cases/category/toggle-category-status.use-case";
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
import { GetCategoriesStatsUseCase } from "src/application/use-cases/category/get-categories-stats.use-case";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class CategoryGrpcController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
    private readonly getCategoriesStatsUseCase: GetCategoriesStatsUseCase,
    private readonly toggleCategoryStatusUseCase: ToggleCategoryStatusUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  @GrpcMethod("CourseService", "GetAllCategories")
  async getAllCategories(
    data: GetAllCategoriesRequest,
    metadata: Metadata,
  ): Promise<CategoriesResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.GetAllCategories",
        async (span) => {
          this.logger.debug("gRPC: Fetching all categories", {
            ctx: CategoryGrpcController.name,
          });

          const categoriesDto = await this.getAllCategoriesUseCase.execute({
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
    } catch (error) {
      this.logger.error(`Failed to get all categories: ${error.message}`, {
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
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.GetCategoriesStats",
        async (span) => {
          this.logger.debug("gRPC: Fetching all categories", {
            ctx: CategoryGrpcController.name,
          });

          const stats = await this.getCategoriesStatsUseCase.execute(data);

          return {
            stats,
          } as GetCategoriesStatsResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to get all categories: ${error.message}`, {
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
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.CreateCategory",
        async (span) => {
          this.logger.debug(`gRPC: Creating category ${data.name}`, {
            ctx: CategoryGrpcController.name,
          });

          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const categoryDto = await this.createCategoryUseCase.execute(
            data,
            idempotencyKey,
          );

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to create category: ${error.message}`, {
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
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.UpdateCategory",
        async (span) => {
          this.logger.debug(`gRPC: Updating category ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          const categoryDto = await this.updateCategoryUseCase.execute(data);

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to update category: ${error.message}`, {
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
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.DeleteCategory",
        async (span) => {
          this.logger.debug(`gRPC: Deleting category ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          await this.deleteCategoryUseCase.execute(data.id);

          return {
            success: { deleted: true },
          } as DeleteCategoryResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to delete category: ${error.message}`, {
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
      return await this.tracer.startActiveSpan(
        "CategoryGrpcController.ToggleCategoryStatus",
        async (span) => {
          this.logger.debug(`gRPC: Toggling category status ${data.id}`, {
            ctx: CategoryGrpcController.name,
          });

          const categoryDto = await this.toggleCategoryStatusUseCase.execute(
            data.id,
          );

          return {
            category: categoryDto.toGrpcResponse(),
          } as CategoryResponse;
        },
      );
    } catch (error) {
      this.logger.error(`Failed to toggle category status: ${error.message}`, {
        error,
      });
      throw error;
    }
  }
}
