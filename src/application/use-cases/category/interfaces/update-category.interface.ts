import { CategoryDto } from "src/application/dtos/category.dto";

interface UpdateCategoryInput {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  parentId?: string;
}

export abstract class IUpdateCategoryUseCase {
  abstract execute(dto: UpdateCategoryInput): Promise<CategoryDto>;
}
