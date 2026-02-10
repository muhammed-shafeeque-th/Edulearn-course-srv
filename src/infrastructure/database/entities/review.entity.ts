import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { CourseOrmEntity } from "./course.orm-entity";
import { UserOrmEntity } from "./user.entity";

/**
 * ReviewOrmEntity represents a review for a course made by a user (student).
 */
@Entity("reviews")
@Index(["userId", "courseId", "enrollmentId"], { unique: true })
@Index("idx_review_user_id", ["userId"])
@Index("idx_review_course_id", ["courseId"])
export class ReviewOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.reviews, {
    // cascade: true,
  })
  @JoinColumn({ name: "user_id" })
  user: UserOrmEntity;

  @Column("uuid", { name: "course_id" })
  courseId: string;

  /**
   * The course being reviewed.
   * Relation: Many reviews belong to one course.
   */
  @ManyToOne(() => CourseOrmEntity, (course) => course.reviews, {
    onDelete: "CASCADE",
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: "course_id" })
  course: CourseOrmEntity;

  @Column({ type: "float", name: "rating" })
  rating: number;

  @Column({ type: "text", name: "comment", nullable: true })
  comment: string | null;

  @Column("uuid", { name: "enrollment_id", unique: true })
  enrollmentId: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;
}
