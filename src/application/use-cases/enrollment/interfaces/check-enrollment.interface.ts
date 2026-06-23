export abstract class ICheckEnrollmentUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<{ enrolled: boolean }>;
}
