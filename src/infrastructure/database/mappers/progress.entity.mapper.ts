import { Progress, UnitType } from "src/domain/entities/progress.entity";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";

/**
 * ProgressEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class ProgressEntityMapper {

  // --- Progress Mapping ---

  static toOrmProgress(progress: Progress): ProgressOrmEntity {
    const orm = new ProgressOrmEntity();
    orm.id = progress.getId();
    orm.enrollmentId = progress.getEnrollmentId();
    orm.lessonId = progress.getLessonId();
    orm.quizId = progress.getQuizId();
    orm.unitDuration = progress.getDuration();
    orm.watchTime = progress.getWatchTime();
    orm.attempts = progress.getAttempts();
    orm.unitType = progress.getUnitType();
    orm.isPassed = progress.getPassed();
    orm.score = progress.getScore();
    orm.completedAt = progress.getCompletedAt();
    orm.isCompleted = progress.isCompleted();
    orm.createdAt = progress.getCreatedAt();
    orm.updatedAt = progress.getUpdatedAt();
    orm.deletedAt = progress.getDeletedAt();
    return orm;
  }

  static toDomainProgress(orm: ProgressOrmEntity): Progress {
    return new Progress(
      orm.id,
      orm.enrollmentId,
      orm.lessonId,
      orm.quizId,
      orm.unitType as UnitType,
      orm.isCompleted,
      orm.score,
      orm.attempts,
      orm.watchTime,
      orm.unitDuration,
      orm.completedAt,
      orm.isPassed,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt
    );
  }

}
