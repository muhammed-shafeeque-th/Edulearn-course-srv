export interface SubmitQuizAttemptResponse {
  score: number;
  passed: boolean;
  completed: boolean;
  attempts: number;
  milestone?: {
    id: string;
    type: "QUIZ_PASSED" | "QUIZ_PERFECT" | string;
    achievedAt: string;
  };
}

export abstract class ISubmitQuizAttemptUseCase {
  abstract execute(input: {
    enrollmentId: string;
    quizId: string;
    answers: { questionId: string; answers: string[] }[];
    timeSpent: number;
  }): Promise<SubmitQuizAttemptResponse>;
}
