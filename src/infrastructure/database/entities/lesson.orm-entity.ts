import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  Index,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { SectionOrmEntity } from "./section.orm-entity";
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

  @Column("uuid", { name: "section_id" })
  sectionId: string;

  @ManyToOne(() => SectionOrmEntity, (section) => section.lessons, {
    eager: false,
  })
  @JoinColumn({ name: "section_id" })
  @Index("idx_lesson_section_id")
  section: SectionOrmEntity;

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
