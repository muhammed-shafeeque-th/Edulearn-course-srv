import { CategoryDto } from "src/application/dtos/category.dto";

export abstract class IGetCategoryUseCase {
  abstract execute(categoryId: string): Promise<CategoryDto>;
}
