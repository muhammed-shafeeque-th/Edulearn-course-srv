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
    completedAt?: string | null;
    watchTime?: number;
    duration?: number;
    progressPercent?: number;
  }>;

  quizzes: Array<{
    quizId: string;
    completed: boolean;
    score?: number | null;
    attempts: number;
    passed: boolean;
    completedAt?: string | null;
  }>;
}

export interface UpdateLessonProgressRequest {
  currentTime: number;
  duration: number;
  event: "timeupdate" | "completed";
}

export interface UpdateLessonProgressResponse {
  completed: boolean;
  progressPercent: number;
}

export interface SubmitQuizAttemptRequest {
  answers: Array<{ questionId: string; answer: any }>;
  timeSpent: number;
}

export interface SubmitQuizAttemptResponse {
  score: number;
  passed: boolean;
  completed: boolean;
  attempts: number;
}
