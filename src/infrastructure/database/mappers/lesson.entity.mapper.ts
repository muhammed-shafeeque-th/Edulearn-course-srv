import { LessonOrmEntity } from "../entities/lesson.orm-entity";
import { Lesson } from "src/domain/entities/lesson.entity";
/**
 * LessonEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class LessonEntityMapper {
  // --- Lesson Mapping ---

  static toOrmLesson(lesson: Lesson): LessonOrmEntity {
    const orm = new LessonOrmEntity();
    orm.id = lesson.getId();
    orm.sectionId = lesson.getSectionId();
    orm.title = lesson.getTitle();
    orm.contentType = lesson.getContentType();
    orm.idempotencyKey = lesson.getIdempotencyKey();
    orm.contentUrl = lesson.getContentUrl();
    orm.description = lesson.getDescription();
    orm.isPreview = lesson.getIsPreview();
    orm.isPublished = lesson.getIsPublished();
    orm.order = lesson.getOrder();
    orm.metadata = lesson.getMetadata();
    orm.duration = lesson.getDuration();
    orm.createdAt = lesson.getCreatedAt();
    orm.updatedAt = lesson.getUpdatedAt();
    orm.deletedAt = lesson.getDeletedAt();
    return orm;
  }

  static toDomainLesson(orm: LessonOrmEntity): Lesson {
    return new Lesson({
      id: orm.id,
      sectionId: orm.sectionId,
      title: orm.title,
      description: orm.description,
      idempotencyKey: orm.idempotencyKey,
      contentType: orm.contentType,
      contentUrl: orm.contentUrl,
      order: orm.order,
      metadata: orm.metadata,
      isPreview: orm.isPreview,
      isPublished: orm.isPublished,
      duration: orm.duration,
      createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
      updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }

}
