import {
  Entity,
  Column,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { CourseOrmEntity } from "src/infrastructure/database/entities/course.orm-entity";
import { ReviewOrmEntity } from "./review.entity";

@Entity("course_users")
export class UserOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column({ type: "varchar", length: 255, name: "full_name" })
  name: string;

  @Column({ type: "varchar", length: 255, name: "avatar_url" })
  avatar: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "email" })
  email: string;
  //   // Relation: A user (student) can be enrolled in many courses
  //   @ManyToMany(() => CourseOrmEntity, (course) => course.students)
  //   enrolledCourses: CourseOrmEntity[];

  @OneToMany(() => CourseOrmEntity, (course) => course.instructor)
  courses: CourseOrmEntity[];

  @OneToMany(() => ReviewOrmEntity, (review) => review.user)
  reviews: ReviewOrmEntity[];

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
