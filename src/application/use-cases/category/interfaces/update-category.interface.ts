import { Category } from "@/domain/entities/category.entity";

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
  abstract execute(dto: UpdateCategoryInput): Promise<Category>;
}
