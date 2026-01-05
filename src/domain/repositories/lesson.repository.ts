import { Lesson } from "../entities/lesson.entity";

export abstract class ILessonRepository {
  abstract save(lesson: Lesson): Promise<void>;
  /**
   * Find a lesson by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the lesson creation/update.
   * @returns The lesson if found, or null otherwise.
   */
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<Lesson | null>;
  abstract findById(id: string): Promise<Lesson | null>;
  abstract findBySectionId(sectionId: string): Promise<Lesson[]>;
  abstract delete(lesson: Lesson): Promise<void>;
}
