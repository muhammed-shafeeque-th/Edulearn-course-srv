import { Enrollment } from "@/domain/entities/enrollment.entity";

export abstract class IGetEnrollmentsByUserUseCase {
  abstract execute(userId: string): Promise<Enrollment[]>;
}
