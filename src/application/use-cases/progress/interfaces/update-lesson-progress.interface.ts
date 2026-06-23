export interface UpdateLessonProgressResponse {
  completed: boolean;
  progressPercent: number;
  milestone: {
    id: string;
    type: "LESSON_COMPLETED";
    achievedAt: string;
  };
}

export abstract class IUpdateLessonProgressUseCase {
  abstract execute(input: {
    enrollmentId: string;
    lessonId: string;
    currentTime: number;
    duration: number;
    event: "timeupdate" | "completed";
  }): Promise<UpdateLessonProgressResponse>;
}
