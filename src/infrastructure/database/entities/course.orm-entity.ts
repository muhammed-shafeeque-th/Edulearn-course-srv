import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  Index,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";
import { ModuleOrmEntity } from "./module.orm-entity";
import { UserOrmEntity } from "./user.entity";
import { CategoryOrmEntity } from "./category-orm.entity";
import { CourseStatus } from "src/domain/entities/course.entity";
import { EnrollmentOrmEntity } from "./enrollment.orm-entity";
import { ReviewOrmEntity } from "./review.entity";

@Entity("courses")
export class CourseOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({
    type: "tsvector",
    select: false,
    nullable: true,
    name: "search_vector",
  })
  searchVector?: string;

  @Column({ name: "title" })
  @Index("idx_course_title")
  title: string;

  @Column({
    nullable: true,
    unique: true,
    name: "idempotency_key",
    type: "uuid",
  })
  @Index()
  idempotencyKey?: string;

  @Column({ nullable: true, name: "sub_title" })
  subTitle: string;

  @Column({ nullable: true, name: "category" })
  category: string;

  @ManyToOne(() => CategoryOrmEntity, (cat) => cat.courses)
  @JoinColumn({ name: "category", referencedColumnName: "name" })
  categoryRelation: CategoryOrmEntity;

  @Column({ nullable: true, name: "sub_category" })
  subCategory: string;

  @Column({ nullable: true, name: "currency" })
  currency: string;

  @Column({ default: 0, name: "total_lessons_count", type: "int" })
  totalLessonsCount: number;

  @Column({ name: "course_language" })
  courseLanguage: string;

  @Column({ nullable: true, name: "subtitle_language" })
  subtitleLanguage: string;

  @Column({ nullable: true, name: "level" })
  level: string;

  @Column("text", { array: true, nullable: true, name: "topics" })
  topics: string[];

  @Column("text", { array: true, nullable: true, name: "learning_outcomes" })
  learningOutcomes: string[];

  @Column("text", { array: true, nullable: true, name: "target_audience" })
  targetAudience: string[];

  @Column("text", { array: true, nullable: true, name: "course_requirements" })
  courseRequirements: string[];

  @Column({ nullable: true, name: "duration", type: "int" })
  duration: number;

  @Column({ nullable: true, name: "duration_unit" })
  durationUnit: string;

  @Column({ nullable: true, name: "thumbnail" })
  thumbnail: string;

  @Column({ nullable: true, name: "trailer" })
  trailer: string;

  @Column({ default: "draft", name: "status", type: "varchar" })
  status: CourseStatus;

  @Column({ unique: true, name: "slug" })
  @Index("idx_course_slug")
  slug: string;

  @Column({ nullable: true, name: "description", type: "text" })
  description: string;

  @Column({ default: 0, nullable: true, name: "rating", type: "float" })
  rating: number;

  @Column({ default: 0, nullable: true, name: "students", type: "int" })
  students: number;

  @OneToMany(() => EnrollmentOrmEntity, (enrollment) => enrollment.course, {
    eager: false,
  })
  enrollments: EnrollmentOrmEntity[];

  @OneToMany(() => ReviewOrmEntity, (review) => review.course, {
    eager: false,
  })
  reviews: ReviewOrmEntity[];

  @Column({
    default: 0,
    nullable: true,
    name: "number_of_ratings",
    type: "int",
  })
  numberOfRatings: number;

  @Column({ nullable: true, name: "instructor_id", type: "uuid" })
  @Index("idx_course_instructor_id")
  instructorId: string;

  @OneToMany(() => ModuleOrmEntity, (module) => module.course, {
    onDelete: "CASCADE",
  })
  modules: ModuleOrmEntity[];

  @ManyToOne(() => UserOrmEntity, (user) => user.courses, {
    cascade: true,
  })
  @JoinColumn({ name: "instructor_id" })
  instructor: UserOrmEntity;

  @Column({ type: "int", default: 0, name: "price" })
  price: number;

  @Column({ type: "int", nullable: true, name: "discount_price" })
  discountPrice: number;

  @CreateDateColumn({ name: "created_at" })
  @Index("idx_course_created_at")
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  @Index("idx_course_deleted_at")
  deletedAt: Date | null;
}
