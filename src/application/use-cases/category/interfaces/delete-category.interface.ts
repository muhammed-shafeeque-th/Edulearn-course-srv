export abstract class IDeleteCategoryUseCase {
  abstract execute(categoryId: string): Promise<void>;
}
