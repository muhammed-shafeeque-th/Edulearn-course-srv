export abstract class IGetCoursesStatsUseCase {
  /**
   * Fetch overall statistics about courses.
   * @returns An object containing statistics for all courses in the system.
   */
  abstract execute(): Promise<{
    totalCourses: number;
    draftCourses: number;
    publishedCourses: number;
    unPublishedCourses: number;
  }>;
}
