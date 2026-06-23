import { ProgressDto } from "src/application/dtos/progress.dto";

export abstract class IGetProgressesByEnrollmentUseCase {
  abstract execute(enrollmentId: string): Promise<ProgressDto[]>;
}
