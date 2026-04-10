import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryColumn,
  DeleteDateColumn,
} from "typeorm";
import { CourseOrmEntity } from "./course.orm-entity";

@Entity("categories")
export class CategoryOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({ name: "name", unique: true })
  @Index("idx_category_name")
  name: string;

  @Column({ name: "idempotency_key", nullable: true, unique: true })
  @Index("idx_category_idempotency_key")
  idempotencyKey?: string;

  @Column({ name: "slug", unique: true })
  @Index("idx_category_slug")
  slug: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "icon", nullable: true })
  icon?: string;

  @Column({ name: "color", nullable: true })
  color?: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "order", default: 0 })
  order: number;

  @ManyToOne(() => CategoryOrmEntity, (category) => category.subcategories, {
    onDelete: "CASCADE",
  })
  parent?: CategoryOrmEntity;

  @OneToMany(() => CategoryOrmEntity, (category) => category.parent)
  subcategories: CategoryOrmEntity[];

  @OneToMany(() => CourseOrmEntity, (course) => course.categoryRelation)
  courses: CourseOrmEntity[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
