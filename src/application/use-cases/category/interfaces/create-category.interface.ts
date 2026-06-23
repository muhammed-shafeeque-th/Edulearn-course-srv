import { CategoryDto } from "src/application/dtos/category.dto";

interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  parentId?: string;
}

export abstract class ICreateCategoryUseCase {
  abstract execute(
    dto: CreateCategoryInput,
    idempotencyKey: string,
  ): Promise<CategoryDto>;
}
