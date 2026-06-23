export abstract class ICheckCourseEnrollmentUseCase {
  abstract execute(
    courseId: string,
    userId: string,
  ): Promise<{ enrolled: boolean }>;
}
