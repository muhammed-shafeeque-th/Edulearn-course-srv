import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
import { CreateCategoryUseCase } from "./impls/create-category.use-case";
import { GetCategoryUseCase } from "./impls/get-category.use-case";
import { GetCoursesByCategoryUseCase } from "./impls/get-courses-by-category.use-case";
import { UpdateCategoryUseCase } from "./impls/update-category.use-case";
import { DeleteCategoryUseCase } from "./impls/delete-category.use-case";
import { GetSubcategoriesUseCase } from "./impls/get-subcategories.use-case";
import { GetAllCategoriesUseCase } from "./impls/get-all-categories.use-case";
import { ToggleCategoryStatusUseCase } from "./impls/toggle-category-status.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetCategoriesStatsUseCase } from "./impls/get-categories-stats.use-case";
import { ICreateCategoryUseCase } from "./interfaces/create-category.interface";
import { IGetCategoryUseCase } from "./interfaces/get-category.interface";
import { IGetAllCategoriesUseCase } from "./interfaces/get-all-categories.interface";
import { IGetSubcategoriesUseCase } from "./interfaces/get-subcategories.interface";
import { IGetCategoriesStatsUseCase } from "./interfaces/get-categories-stats.interface";
import { IGetCoursesByCategoryUseCase } from "./interfaces/get-courses-by-category.interface";
import { IUpdateCategoryUseCase } from "./interfaces/update-category.interface";
import { IDeleteCategoryUseCase } from "./interfaces/delete-category.interface";
import { IToggleCategoryStatusUseCase } from "./interfaces/toggle-category-status.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateCategoryUseCase, useClass: CreateCategoryUseCase },
    { provide: IGetCategoryUseCase, useClass: GetCategoryUseCase },
    { provide: IGetAllCategoriesUseCase, useClass: GetAllCategoriesUseCase },
    { provide: IGetSubcategoriesUseCase, useClass: GetSubcategoriesUseCase },
    {
      provide: IGetCategoriesStatsUseCase,
      useClass: GetCategoriesStatsUseCase,
    },
    {
      provide: IGetCoursesByCategoryUseCase,
      useClass: GetCoursesByCategoryUseCase,
    },
    { provide: IUpdateCategoryUseCase, useClass: UpdateCategoryUseCase },
    { provide: IDeleteCategoryUseCase, useClass: DeleteCategoryUseCase },
    {
      provide: IToggleCategoryStatusUseCase,
      useClass: ToggleCategoryStatusUseCase,
    },
  ],
  exports: [
    ICreateCategoryUseCase,
    IGetCategoryUseCase,
    IGetAllCategoriesUseCase,
    IGetCoursesByCategoryUseCase,
    IUpdateCategoryUseCase,
    IGetSubcategoriesUseCase,
    IGetCategoriesStatsUseCase,
    IDeleteCategoryUseCase,
    IToggleCategoryStatusUseCase,
  ],
})
export class CategoryModule {}
