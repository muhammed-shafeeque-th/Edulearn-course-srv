import { Section } from "../entities/section.entity";

export abstract class ISectionRepository {
  abstract save(section: Section): Promise<void>;
  abstract update(section: Section): Promise<void>;
  abstract findById(id: string): Promise<Section | null>;
  /**
   * Find a section by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the section creation/update.
   * @returns The section if found, or null otherwise.
   */
  abstract findByIdempotencyKey(
    idempotencyKey: string
  ): Promise<Section | null>;
  abstract findByCourseId(courseId: string): Promise<Section[]>;
  abstract delete(section: Section): Promise<void>;
}
