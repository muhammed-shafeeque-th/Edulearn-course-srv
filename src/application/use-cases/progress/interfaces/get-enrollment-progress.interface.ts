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

export abstract class IGetEnrollmentProgressUseCase {
  abstract execute({
    enrollmentId,
  }: {
    enrollmentId: string;
  }): Promise<EnrollmentProgressResponse>;
}
