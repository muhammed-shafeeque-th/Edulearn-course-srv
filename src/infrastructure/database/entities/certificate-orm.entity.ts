import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { EnrollmentOrmEntity } from "./enrollment.orm-entity";

@Entity("certificates")
@Index(["enrollmentId"], { unique: true })
@Index(["certificateNumber"], { unique: true })
export class CertificateOrmEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column("uuid", { name: "enrollment_id" })
  enrollmentId: string;

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "course_id" })
  courseId: string;

  @Column({ name: "course_title" })
  courseTitle: string;

  @Column({ name: "student_name" })
  studentName: string;

  @Column({ type: "timestamp", name: "completed_at" })
  completedAt: Date;

  @Column({ unique: true, name: "certificate_number" })
  certificateNumber: string;

  @Column({ type: "timestamp", name: "issue_date" })
  issueDate: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => EnrollmentOrmEntity, { onDelete: "CASCADE" })
  enrollment: EnrollmentOrmEntity;
}
