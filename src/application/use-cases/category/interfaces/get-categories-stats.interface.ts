import {
  CategoriesStats,
  GetCategoriesStatsRequest,
} from "src/infrastructure/grpc/generated/course/types/category";

export abstract class IGetCategoriesStatsUseCase {
  abstract execute(dto: GetCategoriesStatsRequest): Promise<CategoriesStats>;
}
