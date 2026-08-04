export interface IQueryOptions<T> {
  where?: Partial<Record<keyof T, any>>;
  relations?: string[];
  skip?: number;
  take?: number;
  order?: Partial<Record<keyof T, "ASC" | "DESC">>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export abstract class IBaseRepository<T, ID = string> {
  // abstract findById(id: ID): Promise<T | null>;
  // abstract findAll(options?: IQueryOptions<T>): Promise<PaginatedResult<T>>;
  // abstract create(entity: T): Promise<void>;
  // abstract update(entity: T): Promise<void>;
  // abstract delete(id: ID): Promise<void>;
}
