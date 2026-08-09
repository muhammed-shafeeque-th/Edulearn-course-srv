import { ProgressData } from "src/infrastructure/grpc/generated/course/types/progress";
import { Progress } from "../../domain/entities/progress.entity";

export class ProgressMapper {
  static toGrpcResponse(progress: Progress): ProgressData {
    return {
      id: progress.getId(),
      enrollmentId: progress.getEnrollmentId(),
      lessonId: progress.getUnitId(),
      completed: progress.getCompleted(),
      // score: progress.getScore(),
      // isCompleted: progress.isCompleted(),
      // isPassed: progress.getPassed(),
      completedAt: progress.getCompletedAt()?.toISOString(),
      createdAt: progress.getCreatedAt().toDateString(),
      updatedAt: progress.getUpdatedAt().toISOString(),
      deletedAt: progress.getDeletedAt()?.toISOString(),
    };
  }
}
