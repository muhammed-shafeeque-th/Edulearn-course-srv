import { EnrollmentDto } from "src/application/dtos/enrollment.dto";

export abstract class IGetEnrollmentUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<EnrollmentDto>;
}
