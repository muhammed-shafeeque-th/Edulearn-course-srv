import { ProgressDto } from "src/application/dtos/progress.dto";

export abstract class IUpdateProgressUseCase {
  abstract execute(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<ProgressDto>;
}
