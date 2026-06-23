import { CategoryDto } from "src/application/dtos/category.dto";

export abstract class IToggleCategoryStatusUseCase {
  abstract execute(categoryId: string): Promise<CategoryDto>;
}
