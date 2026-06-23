import { EnrollmentDto } from "src/application/dtos/enrollment.dto";

export abstract class IGetEnrollmentsByCourseUseCase {
  abstract execute(courseId: string): Promise<EnrollmentDto[]>;
}
