import { Enrollment } from "@/domain/entities/enrollment.entity";

export abstract class IGetEnrollmentsByCourseUseCase {
  abstract execute(courseId: string): Promise<Enrollment[]>;
}
