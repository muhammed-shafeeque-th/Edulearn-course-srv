import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  PrimaryColumn,
  Index,
  OneToMany,
  OneToOne,
} from "typeorm";
import { ModuleOrmEntity } from "./module.orm-entity";
import { QuestionProps } from "src/domain/entities/quiz.entity";
import { ProgressOrmEntity } from "./progress.orm-entity";

@Entity("quizzes")
export class QuizOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({ name: "course_id", type: "uuid" })
  courseId: string;

  @Column({ name: "idempotency_key", nullable: true, unique: true })
  @Index("idx_quiz_idempotency_key")
  idempotencyKey?: string;

  @OneToMany(() => ProgressOrmEntity, (progress) => progress.quiz)
  progressEntries: ProgressOrmEntity[];

  @OneToOne(() => ModuleOrmEntity, (module) => module.quiz, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "module_id" })
  module: ModuleOrmEntity;

  @Column("uuid", { name: "module_id" })
  moduleId: string;

  @Column({ name: "title", nullable: true })
  title: string;

  @Column({ name: "description", nullable: true })
  description: string;

  @Column({ type: "int", nullable: true, name: "time_limit" })
  timeLimit: number; // in minutes

  @Column({ type: "int", nullable: true, name: "passing_score" })
  passingScore: number; // percentage (0-100)

  @Column({ type: "int", nullable: true, name: "max_attempts" })
  maxAttempts: number;

  @Column({ name: "is_required", default: false })
  isRequired: boolean;

  // Consider separate entity if structured
  @Column("jsonb", { name: "questions", nullable: true })
  questions: QuestionProps[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;
}
