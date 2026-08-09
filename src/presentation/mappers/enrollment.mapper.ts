import { EnrollmentData } from "src/infrastructure/grpc/generated/course/types/enrollment";
import {
  Enrollment,
  EnrollmentStatus,
} from "../../domain/entities/enrollment.entity";
import { Course } from "src/domain/entities/course.entity";

export class EnrollmentMapper {
  static toGrpcResponse(enrollment: Enrollment): EnrollmentData {
    return {
      id: enrollment.getId(),
      userId: enrollment.getStudentId(),
      completedAt: enrollment.getCompletedAt()?.toISOString(),
      progress: enrollment.getProgressPercent(),
      courseId: enrollment.getCourseId(),
      enrolledAt: enrollment.getEnrolledAt().toISOString(),
      status: enrollment.getStatus(),
      createdAt: enrollment.getCreatedAt().toISOString(),
      updatedAt: enrollment.getUpdatedAt()?.toISOString(),
      deletedAt: enrollment.getDeletedAt()?.toISOString(),

      course: {
        category: enrollment?.getCourse()?.getCategory(),
        id: enrollment?.getCourse()?.getId(),
        instructor: {
          id: enrollment?.getCourse()?.getInstructor().getId(),
          name: enrollment?.getCourse()?.getInstructor().getName(),
          avatar: enrollment?.getCourse()?.getInstructor().getAvatar(),
          email: enrollment?.getCourse()?.getInstructor().getEmail(),
        },
        lessonsCount: enrollment?.getCourse()?.getTotalLessonCount(),
        level: enrollment?.getCourse()?.getLevel(),
        rating: enrollment?.getCourse()?.getRating(),
        thumbnail: enrollment?.getCourse()?.getThumbnail(),
        title: enrollment?.getCourse()?.getTitle(),
      },
    };
  }
}
