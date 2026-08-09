import { Category } from "@/domain/entities/category.entity";

export abstract class IGetCategoryUseCase {
  abstract execute(categoryId: string): Promise<Category>;
}
