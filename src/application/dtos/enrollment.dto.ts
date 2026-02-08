import { EnrollmentData } from "src/infrastructure/grpc/generated/course/types/enrollment";
import {
  Enrollment,
  EnrollmentStatus,
} from "../../domain/entities/enrollment.entity";
import { Course } from "src/domain/entities/course.entity";

export class EnrollmentDto {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: EnrollmentStatus;
  progress: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  course?: Course

  static fromDomain(enrollment: Enrollment): EnrollmentDto {
    const dto = new EnrollmentDto();
    dto.id = enrollment.getId();
    dto.userId = enrollment.getStudentId();
    dto.completedAt = enrollment.getCompletedAt();
    dto.progress = enrollment.getProgressPercent();
    dto.courseId = enrollment.getCourseId();
    dto.enrolledAt = enrollment.getEnrolledAt();
    dto.status = enrollment.getStatus();
    dto.createdAt = enrollment.getCreatedAt();
    dto.updatedAt = enrollment.getUpdatedAt();
    dto.deletedAt = enrollment.getDeletedAt();

    dto.course = enrollment.getCourse();
    return dto;
  }

  public toGrpcResponse = (): EnrollmentData => {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      progress: this.progress,
      completedAt: this.completedAt?.toISOString(),
      status: this.status.toString(),
      enrolledAt: this.enrolledAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString() : "",
      course: {
        category: this.course.getCategory(),
        id: this.course.getId(),
        instructor: {
          id: this.course.getInstructor().getId(),
          name: this.course.getInstructor().getName(),
          avatar: this.course.getInstructor().getAvatar(),
          email: this.course.getInstructor().getEmail()
        },
        lessonsCount: this.course.getTotalLessonCount(),
        level: this.course.getLevel(),
        rating: this.course.getRating(),
        thumbnail: this.course.getThumbnail(),
        title: this.course.getTitle(),
      }
    };
  };
}
