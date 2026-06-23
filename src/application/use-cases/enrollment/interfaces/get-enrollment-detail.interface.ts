interface LessonDetailDTO {
  id: string;
  title: string;
  order: number;
  duration?: number;
  completed: boolean;
  completedAt?: string;
}

export interface QuestionOptionDTO {
  value: string;
}

export interface QuizQuestionDTO {
  id: string;
  requirePassingScore: boolean;
  options: QuestionOptionDTO[];
  timeLimit?: number;
  question: string;
  explanation?: string;
  score?: number;
  correctAnswer?: string;
  type: string;
}

export interface QuizDetailDTO {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestionDTO[];
  timeLimit?: number;
  requirePassingScore: boolean;
  passingScore?: number;
  completed: boolean;
  passed?: boolean;
  score?: number;
  completedAt?: string;
}

interface ModuleDetailDTO {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: LessonDetailDTO[];
  quiz?: QuizDetailDTO;
}

export interface EnrollmentDetailDTO {
  enrollmentId: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  status: string;
  enrolledAt: string;
  modules: ModuleDetailDTO[];
}

export abstract class IGetEnrollmentDetailUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<EnrollmentDetailDTO>;
}
