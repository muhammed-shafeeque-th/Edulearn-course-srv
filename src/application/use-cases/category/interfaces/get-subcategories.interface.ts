import { Category } from "@/domain/entities/category.entity";

export abstract class IGetSubcategoriesUseCase {
  abstract execute(parentId: string): Promise<Category[]>;
}
