import { Category } from "@/domain/entities/category.entity";

export abstract class IGetAllCategoriesUseCase {
  abstract execute(dto: {
    includeDeleted?: boolean;
    activeOnly?: boolean;
  }): Promise<Category[]>;
}
