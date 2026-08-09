import { Progress } from "src/domain/entities/progress.entity";

export abstract class ICreateProgressUseCase {
  abstract execute(
    enrollmentId: string,
    lessonId: string,
  ): Promise<Progress>;
}
