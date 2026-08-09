import { Progress } from "src/domain/entities/progress.entity";

export abstract class IGetProgressUseCase {
  abstract execute(progressId: string): Promise<Progress>;
}
