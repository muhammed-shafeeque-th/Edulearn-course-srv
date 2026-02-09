import { User } from "src/domain/entities/user.entity";
import { UserOrmEntity } from "../entities/user.entity";
import { SectionOrmEntity } from "../entities/section.orm-entity";
import { Section } from "src/domain/entities/section.entity";
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
import { UserEntityMapper } from "./user.entity.mapper";

/**
 * ReviewEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class ReviewEntityMapper {

  // --- Review Mapping ---

  static toOrmReview(review: Review): ReviewOrmEntity {
    const orm = new ReviewOrmEntity();
    orm.id = review.getId();
    // orm.user = UserEntityMapper.toOrmUser(review.getUser());
    orm.userId = review.getUserId();
    orm.courseId = review.getCourseId();
    orm.enrollmentId = review.getEnrollmentId();
    orm.rating = review.getRating();
    orm.comment = review.getComment();
    orm.createdAt = review.getCreatedAt();
    orm.updatedAt = review.getUpdatedAt();
    orm.deletedAt = review.getDeletedAt();
    return orm;
  }

  static toDomainReview(orm: ReviewOrmEntity): Review {
    const user = orm.user
      ? UserEntityMapper.toDomainUser(orm.user)
      : undefined;
    return new Review(
      orm.id,
      orm.userId,
      user,
      orm.courseId,
      orm.enrollmentId,
      orm.rating,
      orm.comment,
      orm.createdAt ? new Date(orm.createdAt) : undefined,
      orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      orm.deletedAt ? new Date(orm.deletedAt) : undefined
    );
  }

}
