import { ProgressDto } from "src/application/dtos/progress.dto";

export abstract class ICreateProgressUseCase {
  abstract execute(
    enrollmentId: string,
    lessonId: string,
  ): Promise<ProgressDto>;
}
