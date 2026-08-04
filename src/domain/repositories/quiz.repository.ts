import { Quiz } from "../entities/quiz.entity";
import { IBaseRepository } from "./base.repository";

export abstract class IQuizRepository extends IBaseRepository<Quiz> {
  abstract save(quiz: Quiz): Promise<void>;
  abstract findById(id: string): Promise<Quiz | null>;
  /**
   * Find a quiz by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the quiz creation/update.
   * @returns The quiz if found, or null otherwise.
   */
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<Quiz | null>;
  abstract findByCourseId(courseId: string): Promise<Quiz[]>;
  abstract findByModuleId(moduleId: string): Promise<Quiz>;
  abstract delete(quiz: Quiz): Promise<void>;
}
