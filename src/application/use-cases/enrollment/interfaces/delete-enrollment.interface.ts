export abstract class IDeleteEnrollmentUseCase {
  abstract execute(enrollmentId: string): Promise<void>;
}
