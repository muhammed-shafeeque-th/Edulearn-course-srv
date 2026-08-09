import { Category } from "@/domain/entities/category.entity";

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
  ): Promise<Category>;
}
