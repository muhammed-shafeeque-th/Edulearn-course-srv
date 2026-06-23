import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { CourseOrmEntity } from "./course.orm-entity";
import { LessonOrmEntity } from "./lesson.orm-entity";
import { QuizOrmEntity } from "./quiz.orm-entity";

@Entity("sections")
export class SectionOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string;

  @Column({
    name: "idempotency_key",
    type: "uuid",
    nullable: true,
    unique: true,
  })
  @Index("idx_section_idempotency_key")
  idempotencyKey?: string;

  @Column({ name: "order", type: "int", nullable: true })
  @Index("idx_section_order")
  order: number;

  @Column({ name: "is_published", type: "boolean", default: false })
  isPublished: boolean;

  @Column("uuid", { name: "course_id" })
  courseId: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @ManyToOne(() => CourseOrmEntity, (course) => course.sections, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "course_id" })
  @Index("idx_section_course_id")
  course: CourseOrmEntity;

  @OneToMany(() => LessonOrmEntity, (lesson) => lesson.section, {
    cascade: true,
  })
  lessons: LessonOrmEntity[];

  @OneToOne(() => QuizOrmEntity, (quiz) => quiz.section, {
    cascade: true,
    nullable: true,
  })
  quiz?: QuizOrmEntity | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  @Index("idx_section_deleted_at")
  deletedAt: Date | null;
}
