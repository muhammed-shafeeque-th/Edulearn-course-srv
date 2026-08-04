import { Category } from "../entities/category.entity";
import { Course } from "../entities/course.entity";
import { IBaseRepository } from "./base.repository";

export interface CategoryStats {
  category: string;
  count: number;
}

export abstract class ICategoryRepository implements IBaseRepository<Category> {
  abstract create(category: Category): Promise<void>;
  abstract update(category: Category): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<Category | null>;
  abstract findBySlug(id: string): Promise<Category | null>;
  abstract findAll(): Promise<Category[]>;
  abstract getStats(top?: number): Promise<CategoryStats[]>;
  abstract findSubcategories(parentId: string): Promise<Category[]>;
  abstract findCoursesByCategory(categoryId: string): Promise<Course[]>; // later replace with Course domain entity
}
