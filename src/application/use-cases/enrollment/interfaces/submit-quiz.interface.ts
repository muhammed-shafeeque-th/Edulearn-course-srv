export interface SubmitQuizCommandDTO {
  enrollmentId: string;
  quizId: string;
  userId: string;
  score: number;
}

export interface SubmitQuizResultDTO {
  enrollmentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  progressPercent: number;
  status: string;
  completedAt?: Date;
}

export abstract class ISubmitQuizUseCase {
  abstract execute(cmd: SubmitQuizCommandDTO): Promise<SubmitQuizResultDTO>;
}
