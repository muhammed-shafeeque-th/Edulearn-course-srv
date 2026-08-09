import { Enrollment } from "@/domain/entities/enrollment.entity";

export abstract class IGetEnrollmentUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<Enrollment>;
}
