import { Module } from "../entities/module.entity";
import { IBaseRepository } from "./base.repository";

export abstract class IModuleRepository extends IBaseRepository<Module> {
  abstract save(module: Module): Promise<void>;
  abstract update(module: Module): Promise<void>;
  abstract findById(id: string): Promise<Module | null>;
  /**
   * Find a module by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the module creation/update.
   * @returns The module if found, or null otherwise.
   */
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<Module | null>;
  abstract findByCourseId(courseId: string): Promise<Module[]>;
  abstract delete(module: Module): Promise<void>;
}
