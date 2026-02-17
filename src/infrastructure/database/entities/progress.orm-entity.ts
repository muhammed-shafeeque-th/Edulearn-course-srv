import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";
import { EnrollmentOrmEntity } from "./enrollment.orm-entity";
import { LessonOrmEntity } from "./lesson.orm-entity";
import { QuizOrmEntity } from "./quiz.orm-entity";
import { UnitType } from "src/domain/entities/progress.entity";

@Entity("progress")
@Index(["enrollmentId", "lessonId"], { unique: true })
@Index(["enrollmentId", "quizId"], { unique: true })
export class ProgressOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column("uuid", { name: "enrollment_id" })
  enrollmentId: string;

  @Column("uuid", { name: "lesson_id", nullable: true })
  lessonId: string;

  @Column("uuid", { name: "quiz_id", nullable: true })
  quizId: string;

  @Column({ name: "unit_type" })
  unitType: UnitType;

  @Column({ default: false, name: "is_completed" })
  isCompleted: boolean;

  @Column({ default: 0, name: "attempts" })
  attempts: number;

  @Column({ default: 0, name: "watch_time" })
  watchTime: number;

  @Column({ default: 0, name: "unit_duration" })
  unitDuration: number;

  @Column({ type: "float", nullable: true, name: "score" })
  score?: number;

  @Column({ type: "boolean", nullable: true, name: "is_passed" })
  isPassed?: boolean;

  @Column({ type: "timestamp", nullable: true, name: "completed_at" })
  completedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  /**
   * ManyToOne relation to Enrollment
   * Proper join column specified and explicit relation name for clarity.
   */
  @ManyToOne(
    () => EnrollmentOrmEntity,
    (enrollment) => enrollment.progressEntries,
    { onDelete: "CASCADE", eager: false }
  )
  @JoinColumn({ name: "enrollment_id", referencedColumnName: "id" })
  enrollment: EnrollmentOrmEntity;

  /**
   * Polymorphic relation:
   * For best practice in polymorphic relations, only one of lessonId or quizId will resolve.
   * These relations should be marked nullable.
   */
  @ManyToOne(() => LessonOrmEntity, (lesson) => lesson.progressEntries, {
    eager: false,
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "lesson_id", referencedColumnName: "id" })
  lesson?: LessonOrmEntity;

  @ManyToOne(() => QuizOrmEntity, (quiz) => quiz.progressEntries, {
    eager: false,
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "quiz_id", referencedColumnName: "id" })
  quiz?: QuizOrmEntity;
}
