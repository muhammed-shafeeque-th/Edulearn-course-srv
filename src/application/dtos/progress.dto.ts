import { ProgressData } from "src/infrastructure/grpc/generated/course/types/progress";
import { Progress } from "../../domain/entities/progress.entity";

export class ProgressDto {
  id: string;
  enrollmentId: string;
  unitId: string;
  unitType: string;
  score: number;
  isCompleted: boolean;
  isPassed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static fromDomain(progress: Progress): ProgressDto {
    const dto = new ProgressDto();
    dto.id = progress.getId();
    dto.enrollmentId = progress.getEnrollmentId();
    dto.unitId = progress.getUnitId();
    dto.unitType = progress.getUnitType();
    dto.score = progress.getScore();
    dto.isCompleted = progress.isCompleted();
    dto.isPassed = progress.getPassed();
    dto.completedAt = progress.getCompletedAt();
    dto.createdAt = progress.getCreatedAt();
    dto.updatedAt = progress.getUpdatedAt();
    dto.deletedAt = progress.getDeletedAt();
    return dto;
  }

  public toGrpcResponse = (): ProgressData => {
    return {
      id: this.id,
      enrollmentId: this.enrollmentId,
      lessonId: this.unitId,
      completed: this.isCompleted,
      completedAt: this.completedAt ? this.completedAt?.toISOString() : "",
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString() : "",
    };
  };
}
