import { Injectable } from "@nestjs/common";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { EnrollmentStatus } from "src/domain/entities/enrollment.entity";
import { ProgressNotFoundException } from "src/domain/exceptions/progress.exceptions";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IUpdateLessonProgressUseCase } from "../interfaces/update-lesson-progress.interface";

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
export class UpdateLessonProgressUseCase implements IUpdateLessonProgressUseCase {
  constructor(
    private readonly _enrollmentRepo: IEnrollmentRepository,
    private readonly _progressRepo: IProgressRepository,
    private readonly _logger: ILoggerService,
  ) {}

  async execute(input: {
    enrollmentId: string;
    lessonId: string;
    currentTime: number;
    duration: number;
    event: "timeupdate" | "completed";
  }): Promise<UpdateLessonProgressResponse> {
    //  Load with progress to avoid extra query
    const enrollment = await this._enrollmentRepo.findById(input.enrollmentId, {
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
      this._logger.warn("Cannot update progress for non-active enrollment");
      return {
        completed: true,
        progressPercent: 100,
        milestone: undefined,
      };
      // throw new ForbiddenException('Cannot update progress for non-active enrollment');
    }

    // Better error handling for progress entry
    const progressEntry =
      await this._progressRepo.findByEnrollmentIdAndLessonId(
        input.enrollmentId,
        input.lessonId,
      );

    if (!progressEntry) {
      throw new ProgressNotFoundException(
        `Progress entry not found for lesson ${input.lessonId} in enrollment ${input.enrollmentId}`,
      );
    }

    //  Always use absolute time (treatAsAbsolute=true is default)
    progressEntry.updateWatchProgress(input.currentTime, input.duration, true);

    const newlyCompleted =
      progressEntry.isCompleted() && !progressEntry.wasPreviouslyCompleted();

    enrollment.updateProgressEntry(progressEntry);

    await this._enrollmentRepo.upsert(enrollment);

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
