import {
  Course,
  CourseMetadata,
  CourseStatus,
} from "../entities/course.entity";
import { IBaseRepository, PaginatedResult } from "./base.repository";

export type GetCourseParams = {
  page: number;
  limit: number;
  status?: CourseStatus;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string | undefined;
  category: string[];
  level: string[];
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  rating?: number | undefined;
};

export interface MonthlyCoursesEnrollment {
  month: number;
  count: number;
}

export interface InstructorCoursesStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalRatings: number;
  averageRating: number;
  totalHoursTaught: number;
}

export interface MonthlyCoursesEnrollmentStats {
  stats: MonthlyCoursesEnrollment[];
}

export type CourseRelationOptions = {
  withModules?: boolean;
  withLessons?: boolean;
  withQuiz?: boolean;
};

export abstract class ICourseRepository extends IBaseRepository<Course> {
  abstract updateLessonCount(courseId: string, count: number): Promise<void>;
  /**
   * Execute a function within a database transaction.
   *
   * For transactional use-cases, e.g. saving both a review and a course.
   * The callback receives the manager to run your ORM operations against.
   *
   * @template T Return type of your transactional block.
   * @param cb The callback function that receives the transaction manager.
   * @returns Promise<T> The result of the transactional function.
   */
  abstract transaction<T>(cb: (manager: any) => Promise<T>): Promise<T>;
  abstract save(course: Course): Promise<void>;
  abstract findById(
    id: string,
    options?: CourseRelationOptions,
  ): Promise<Course | null>;
  /**
   * Find a course by its idempotency key.
   * @param idempotencyKey The unique idempotency key associated with the course creation/update.
   * @returns The course if found, or null otherwise.
   */
  abstract findByIdempotencyKey(
    idempotencyKey: string,
    options?: CourseRelationOptions,
  ): Promise<Course | null>;
  abstract findBySlug(
    slug: string,
    options?: CourseRelationOptions,
  ): Promise<Course | null>;
  abstract findByIds(ids: string[]): Promise<CourseMetadata[]>;
  abstract findByInstructorId(
    instructorId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<PaginatedResult<CourseMetadata>>;
  abstract update(course: Course): Promise<void>;
  abstract delete(course: Course): Promise<void>;

  /**
   * Get aggregate statistics for courses belonging to a specific instructor.
   * @param instructorId The unique ID of the instructor.
   */
  abstract getInstructorCoursesStats(
    instructorId: string,
  ): Promise<InstructorCoursesStats>;

  abstract getCoursesStats(): Promise<{
    totalCourses: number;
    draftCourses: number;
    publishedCourses: number;
    unPublishedCourses: number;
  }>;

  abstract getInstructorCourseRatingStats(
    instructorId: string,
    courseId: string,
  ): Promise<{ averageRating: number; totalRatings: number }>;

  abstract findByUserId(
    userId: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
  ): Promise<PaginatedResult<Course>>;
  abstract findAll(
    options: GetCourseParams,
  ): Promise<PaginatedResult<CourseMetadata>>;
}

export const COURSE_REPOSITORY = "COURSE_REPOSITORY";
