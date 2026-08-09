import { Progress } from "src/domain/entities/progress.entity";

export abstract class IUpdateProgressUseCase {
  abstract execute(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<Progress>;
}
