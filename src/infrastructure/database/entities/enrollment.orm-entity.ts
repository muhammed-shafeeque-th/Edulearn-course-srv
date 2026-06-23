import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { CourseOrmEntity } from './course.orm-entity';
import { ProgressOrmEntity } from './progress.orm-entity';

@Entity('enrollments')
@Index(['studentId', 'courseId', "deletedAt"], { unique: true })
@Index(['instructorId'])
export class EnrollmentOrmEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'student_id' })
  studentId: string;

  @Column('uuid', { name: 'instructor_id', nullable: true })
  instructorId: string;

  @Column('uuid', { name: 'course_id' })
  courseId: string;

  @Column('uuid', { name: 'order_id' })
  orderId: string;

  @Column({ name: 'idempotency_key', nullable: true })
  idempotencyKey?: string;

  @Column({ type: 'timestamp', name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ name: 'status' })
  status: string;

  @Column({ type: 'float', default: 0, name: 'progress_percent' })
  progressPercent: number;

  @Column({ type: 'int', default: 0, name: 'total_learning_units' })
  totalLearningUnits: number;

  @Column({ type: 'int', default: 0, name: 'completed_learning_units' })
  completedLearningUnits: number;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => CourseOrmEntity, (course) => course.enrollments, {
    eager: false,
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: CourseOrmEntity;

  @OneToMany(() => ProgressOrmEntity, (progress) => progress.enrollment, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  progressEntries: ProgressOrmEntity[];
}
