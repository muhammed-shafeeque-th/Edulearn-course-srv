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
import { CourseEntityMapper } from "./course.entity.mapper";
import { ProgressEntityMapper } from "./progress.entity.mapper";

/**
 * EnrollmentEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class EnrollmentEntityMapper {

  // --- Enrollment Mapping ---

  static toOrmEnrollment(enrollment: Enrollment): EnrollmentOrmEntity {
    const orm = new EnrollmentOrmEntity();
    orm.id = enrollment.getId();
    orm.studentId = enrollment.getStudentId();
    orm.courseId = enrollment.getCourseId();
    orm.orderId = enrollment.getOrderId();
    orm.instructorId = enrollment.getInstructorId();
    orm.idempotencyKey = enrollment.getIdempotencyKey();
    orm.enrolledAt = enrollment.getEnrolledAt();
    orm.status = enrollment.getStatus();
    orm.progressPercent = enrollment.getProgressPercent();
    orm.completedAt = enrollment.getCompletedAt();
    orm.createdAt = enrollment.getCreatedAt();
    orm.updatedAt = enrollment.getUpdatedAt();
    orm.deletedAt = enrollment.getDeletedAt();
    orm.totalLearningUnits = enrollment.getTotalLearningUnits();
    orm.completedLearningUnits = enrollment.getCompletedLearningUnits();
    const progressEntries = enrollment.getProgressEntries();
    if (progressEntries && progressEntries.length) {
      orm.progressEntries = progressEntries.map(ProgressEntityMapper.toOrmProgress);
    }
    return orm;
  }

  static toDomainEnrollment(
    orm: EnrollmentOrmEntity,
    opts?: { withProgress: boolean }
  ): Enrollment {
    let progressDomain: Progress[] = [];
    if (opts?.withProgress && orm.progressEntries) {
      progressDomain = orm.progressEntries.map(ProgressEntityMapper.toDomainProgress);
    }
    const enrollment = new Enrollment(
      orm.id,
      orm.studentId,
      orm.courseId,
      orm.orderId,
      orm.instructorId,
      orm.idempotencyKey,
      orm.enrolledAt,
      orm.status as EnrollmentStatus,
      orm.progressPercent,
      orm.completedAt,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt,
      progressDomain,
      orm.totalLearningUnits,
      orm.completedLearningUnits
    );
    if (orm.course) {
      const course = CourseEntityMapper.toDomainCourse(orm.course);
      enrollment.setCourse(course);
    }

    return enrollment;
  }


}
