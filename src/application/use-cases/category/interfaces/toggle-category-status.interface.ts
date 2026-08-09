import { Category } from "@/domain/entities/category.entity";

export abstract class IToggleCategoryStatusUseCase {
  abstract execute(categoryId: string): Promise<Category>;
}
