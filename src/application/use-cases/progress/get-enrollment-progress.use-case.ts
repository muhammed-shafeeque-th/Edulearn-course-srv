import { Injectable } from "@nestjs/common";
import { EnrollmentNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";

export interface EnrollmentProgressResponse {
    enrollmentId: string;
    courseId: string;
    userId: string;
  
    overallProgress: number;
    completedUnits: number;
    totalUnits: number;
  
    lessons: Array<{
      lessonId: string;
      completed: boolean;
      completedAt?: string;
      watchTime?: number;
      progressPercent?: number;
      duration?: number;
    }>;
  
    quizzes: Array<{
      quizId: string;
      completed: boolean;
      score?: number;
      attempts: number;
      passed: boolean;
      completedAt?: string;
    }>;
  }
  
  @Injectable()
  export class GetEnrollmentProgressUseCase {
    constructor(
      private readonly enrollmentRepo: IEnrollmentRepository,
      private readonly progressRepo: IProgressRepository,
    ) {}
  
    async execute({ enrollmentId }: { enrollmentId: string }): Promise<EnrollmentProgressResponse> {
      const enrollment = await this.enrollmentRepo.getById(enrollmentId, {
        includeCourse: false,
        includeProgressSummary: true, 
      });
      
      if (!enrollment) {
        throw new EnrollmentNotFoundException('Enrollment not found');
      }
  
      // Use progress already loaded from enrollment
      const progressEntries = enrollment.getProgressEntries();
  
      // If for some reason progress wasn't loaded, fetch separately
      if (!progressEntries || progressEntries.length === 0) {
        const fetchedProgress = await this.progressRepo.findByEnrollmentId(enrollmentId);
        enrollment.attachProgress(fetchedProgress);
      }
  
      return {
        enrollmentId,
        userId: enrollment.getStudentId(),
        courseId: enrollment.getCourseId(),
        overallProgress: enrollment.getProgressPercent() ?? 0,
        completedUnits: enrollment.getCompletedLearningUnits(),
        totalUnits: enrollment.getTotalLearningUnits(),
  
        lessons: progressEntries
          .filter((p) => p.isLesson())
          .map((p) => ({
            lessonId: p.getUnitId(),
            completed: p.getCompleted(),
            completedAt: p.getCompletedAt()?.toISOString(), 
            watchTime: p.getWatchTime(),
            progressPercent: p.getProgressPercent(),
            duration: p.getDuration(),
          })),
  
        quizzes: progressEntries
          .filter((p) => p.isQuiz())
          .map((p) => ({
            quizId: p.getUnitId(),
            completed: p.getCompleted(),
            passed: p.getPassed() ?? false,
            score: p.getScore() ?? 0,
            attempts: p.getAttempts(),
            completedAt: p.getCompletedAt()?.toISOString(), 
          })),
      };
    }
  }
  