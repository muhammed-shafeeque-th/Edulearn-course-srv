import { CategoryDto } from "src/application/dtos/category.dto";

export abstract class IGetSubcategoriesUseCase {
  abstract execute(parentId: string): Promise<CategoryDto[]>;
}
