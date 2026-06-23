import { CategoryDto } from "src/application/dtos/category.dto";

export abstract class IGetAllCategoriesUseCase {
  abstract execute(dto: {
    includeDeleted?: boolean;
    activeOnly?: boolean;
  }): Promise<CategoryDto[]>;
}
