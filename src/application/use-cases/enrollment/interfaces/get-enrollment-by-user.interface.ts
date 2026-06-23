import { EnrollmentDto } from "src/application/dtos/enrollment.dto";

export abstract class IGetEnrollmentsByUserUseCase {
  abstract execute(userId: string): Promise<EnrollmentDto[]>;
}
