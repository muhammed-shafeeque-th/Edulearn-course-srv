import { User } from "src/domain/entities/user.entity";
import { UserOrmEntity } from "../entities/user.entity";
import { ModuleOrmEntity } from "../entities/module.orm-entity";
import { Module } from "src/domain/entities/module.entity";
import { ReviewOrmEntity } from "../entities/review.entity";
import { Review } from "src/domain/entities/review.entity";
import { QuizOrmEntity } from "../entities/quiz.orm-entity";
import { Question, Quiz } from "src/domain/entities/quiz.entity";
import { Progress, UnitType } from "src/domain/entities/progress.entity";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";
import { LessonOrmEntity } from "../entities/lesson.orm-entity";
import { Lesson } from "src/domain/entities/lesson.entity";
import {
  Enrollment,
  EnrollmentStatus,
} from "src/domain/entities/enrollment.entity";
import { EnrollmentOrmEntity } from "../entities/enrollment.orm-entity";
import { Category } from "src/domain/entities/category.entity";
import { CategoryOrmEntity } from "../entities/category-orm.entity";
import { CourseOrmEntity } from "../entities/course.orm-entity";
import { Course, CourseMetadata } from "src/domain/entities/course.entity";
import { Certificate } from "src/domain/entities/certificate.entity";
import { CertificateOrmEntity } from "../entities/certificate-orm.entity";
import { LessonEntityMapper } from "./lesson.entity.mapper";
import { QuizEntityMapper } from "./quiz.entity.mapper";

/**
 * ModuleEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class ModuleEntityMapper {
  // --- Module Mapping ---

  static toOrmModule(module: Module): ModuleOrmEntity {
    const orm = new ModuleOrmEntity();
    orm.id = module.getId();
    orm.courseId = module.getCourseId();
    orm.title = module.getTitle();
    orm.idempotencyKey = module.getIdempotencyKey();
    orm.order = module.getOrder();
    orm.description = module.getDescription();
    orm.isPublished = module.getIsPublished();
    // orm.lessons = (module.getLessons() || []).map(ModuleEntityMapper.toOrmLesson);
    // const quiz = module.getQuiz();
    // if (quiz) orm.quiz = ModuleEntityMapper.toOrmQuiz(quiz);
    orm.createdAt = module.getCreatedAt();
    orm.updatedAt = module.getUpdatedAt();
    orm.deletedAt = module.getDeletedAt();
    return orm;
  }

  static toDomainModule(orm: ModuleOrmEntity): Module {
    return new Module({
      id: orm.id,
      courseId: orm.courseId,
      title: orm.title,
      idempotencyKey: orm.idempotencyKey,
      order: orm.order,
      description: orm.description,
      isPublished: orm.isPublished,
      lessons: (Array.isArray(orm.lessons) ? orm.lessons : []).map(
        LessonEntityMapper.toDomainLesson,
      ),
      quiz: orm.quiz ? QuizEntityMapper.toDomainQuiz(orm.quiz) : undefined,
      createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
      updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }
}
