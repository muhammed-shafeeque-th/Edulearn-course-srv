import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  Index,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { ModuleOrmEntity } from "./module.orm-entity";
import { ContentType } from "src/domain/entities/lesson.entity";
import { ProgressOrmEntity } from "./progress.orm-entity";

@Entity("lessons")
export class LessonOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({ name: "title", nullable: true })
  title: string;

  @Column({
    type: "enum",
    enum: ContentType,
    nullable: true,
    name: "content_type",
  })
  contentType: ContentType;

  @Column("uuid", { name: "idempotency_key", nullable: true, unique: true })
  @Index("idx_lesson_idempotency_key")
  idempotencyKey?: string;

  @Column({ name: "content_url", nullable: true })
  contentUrl: string;

  // Store asset metadata as JSON
  @Column({ type: "jsonb", name: "metadata", nullable: true })
  metadata: {
    s3Url?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    [key: string]: any;
  };

  @Column({ name: "duration", nullable: true })
  duration: number;

  @Column({ name: "description", nullable: true })
  description: string;

  @Column({ name: "order" })
  @Index("course_lesson_order_idx")
  order: number;

  @Column({ name: "is_published", default: false })
  isPublished: boolean;

  @Column({ name: "is_preview", default: false })
  isPreview: boolean;

  // @Column({ name: "learning_objectives", array: true })
  // learningObjectives: string[];

  @Column("uuid", { name: "module_id" })
  moduleId: string;

  @ManyToOne(() => ModuleOrmEntity, (module) => module.lessons, {
    eager: false,
  })
  @JoinColumn({ name: "module_id" })
  @Index("idx_lesson_module_id")
  module: ModuleOrmEntity;

  @OneToMany(() => ProgressOrmEntity, (progress) => progress.lesson, {
    cascade: true,
    eager: false,
  })
  progressEntries: ProgressOrmEntity[];

  @Column({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", nullable: true })
  @Index("idx_lesson_deleted_at")
  deletedAt: Date | null;
}
