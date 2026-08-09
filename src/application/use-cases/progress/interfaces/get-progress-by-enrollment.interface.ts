import { Progress } from "src/domain/entities/progress.entity";

export abstract class IGetProgressesByEnrollmentUseCase {
  abstract execute(enrollmentId: string): Promise<Progress[]>;
}
