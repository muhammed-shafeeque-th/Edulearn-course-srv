import { Quiz } from "../entities/quiz.entity";

export abstract class IQuizRepository {
  abstract save(quiz: Quiz): Promise<void>;
  abstract findById(id: string): Promise<Quiz | null>;
   /**
   * Find a quiz by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the quiz creation/update.
   * @returns The quiz if found, or null otherwise.
   */
   abstract findByIdempotencyKey(idempotencyKey: string): Promise<Quiz | null>;
  abstract findByCourseId(courseId: string): Promise<Quiz[]>;
  abstract findBySectionId(sectionId: string): Promise<Quiz>;
  abstract delete(quiz: Quiz): Promise<void>;
}
