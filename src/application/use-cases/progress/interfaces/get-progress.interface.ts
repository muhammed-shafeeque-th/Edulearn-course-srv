import { ProgressDto } from "src/application/dtos/progress.dto";

export abstract class IGetProgressUseCase {
  abstract execute(progressId: string): Promise<ProgressDto>;
}
