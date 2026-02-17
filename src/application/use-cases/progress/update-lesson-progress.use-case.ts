import {
  Injectable,
} from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { EnrollmentStatus } from "src/domain/entities/enrollment.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { EnrollmentNotFoundException, ProgressNotFoundException } from "src/domain/exceptions/domain.exceptions";

export interface UpdateLessonProgressResponse {
  completed: boolean;
  progressPercent: number;
  milestone: {
    id: string;
    type: "LESSON_COMPLETED";
    achievedAt: string;
  };
}

@Injectable()
export class UpdateLessonProgressUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly progressRepo: IProgressRepository,
    private readonly logger: LoggingService
  ) {}

  async execute(input: {
    enrollmentId: string;
    lessonId: string;
    currentTime: number;
    duration: number;
    event: "timeupdate" | "completed";
  }): Promise<UpdateLessonProgressResponse> {
    //  Load with progress to avoid extra query
    const enrollment = await this.enrollmentRepo.getById(input.enrollmentId, {
      includeCourse: false,
      includeProgressSummary: true,
    });

    if (!enrollment) {
      throw new EnrollmentNotFoundException("Enrollment not found");
    }

    //  Check enrollment status
    if (enrollment.getDeletedAt()) {
      throw new EnrollmentNotFoundException("Enrollment not found");
    }

    if (enrollment.getStatus() !== EnrollmentStatus.ACTIVE) {
      this.logger.warn("Cannot update progress for non-active enrollment");
      return {
        completed: true,
        progressPercent: 100,
        milestone: undefined,
      };
      // throw new ForbiddenException('Cannot update progress for non-active enrollment');
    }

    // Better error handling for progress entry
    const progressEntry = await this.progressRepo.findByEnrollmentIdAndLessonId(
      input.enrollmentId,
      input.lessonId
    );

    if (!progressEntry) {
      throw new ProgressNotFoundException(
        `Progress entry not found for lesson ${input.lessonId} in enrollment ${input.enrollmentId}`
      );
    }

    //  Always use absolute time (treatAsAbsolute=true is default)
    progressEntry.updateWatchProgress(input.currentTime, input.duration, true);

    const newlyCompleted =
      progressEntry.isCompleted() && !progressEntry.wasPreviouslyCompleted();

    enrollment.updateProgressEntry(progressEntry);

    await this.enrollmentRepo.upsert(enrollment);

    return {
      completed: progressEntry.isCompleted(),
      progressPercent: progressEntry.getProgressPercent(),
      milestone: newlyCompleted
        ? {
            id: `milestone-${Date.now()}`,
            type: "LESSON_COMPLETED",
            achievedAt: new Date().toISOString(),
          }
        : undefined,
    };
  }
}
