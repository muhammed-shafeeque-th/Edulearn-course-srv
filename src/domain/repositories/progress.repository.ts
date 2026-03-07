import { Progress } from "../entities/progress.entity";

export abstract class IProgressRepository {
  abstract save(progress: Progress): Promise<void>;
  abstract findByEnrollmentId(progressId: string): Promise<Progress[]>;
  abstract findById(id: string): Promise<Progress | null>;
  abstract findByEnrollmentIdAndQuizId(
    enrollmentId: string,
    quizId: string,
  ): Promise<Progress | null>;
  abstract findByEnrollmentIdAndLessonId(
    enrollmentId: string,
    lessonId: string,
  ): Promise<Progress | null>;
  abstract delete(progress: Progress): Promise<void>;
}
