import { Enrollment } from "../entities/enrollment.entity";


export interface InstructorCourseEnrollmentSummery {
  totalStudents: number;
  completionRate: number;
  avgProgress: number;
}

export interface InstructorCourseEnrollmentTrend {
  trend: CourseEnrollmentTrend[];
}

export interface CourseEnrollmentTrend {
  date: number;
  enrollments: number;
}


export interface RevenueStat {
  date: number;
  revenue: number;
}

export interface RevenueStats {
  stats: RevenueStat[];
}


export interface InstructorCoursesEnrollmentSummery {
  totalStudents: number;
  totalEarnings: number;
  avgCompletion: number;
  activeStudents: number;
}


/**
 * Repository contract for Enrollment aggregate and its related data.
 */
export abstract class IEnrollmentRepository {
  /**
   * Create or update an enrollment entity in the persistence layer.
   */
  abstract upsert(enrollment: Enrollment): Promise<void>;

  /**
   * Find an enrollment by its unique identifier.
   */
  abstract getById(
    enrollmentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null>;
  /**
   /**
    * Get an enrollment summary for all courses taught by an instructor.
    */
   abstract getInstructorCoursesEnrollmentSummery(
     instructorId: string
   ): Promise<InstructorCoursesEnrollmentSummery | null>;
  /**
   /**
    * Get an enrollment summary for all courses taught by an instructor.
    */
   abstract getInstructorCourseEnrollmentSummery(
     instructorId: string,
     courseId: string
   ): Promise<InstructorCourseEnrollmentSummery | null>;
   /**
    /**
     * Get the enrollment trend for a specific course taught by an instructor.
     */
    abstract getInstructorCourseEnrollmentTrend(
      instructorId: string,
      courseId: string,
      from?: string,
      to?: string
    ): Promise<InstructorCourseEnrollmentTrend | null>;

  /**
   * Find an enrollment by user and course ids.
   */
  abstract getByUserAndCourse(
    userId: string,
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null>;

   /**
   * Retrieves monthly enrollment statistics for courses, optionally filtered by instructor and course.
   * @param year - (Optional) The unique ID of the course.
   * @returns An array of monthly enrollment stats (month and count) for the specified parameters.
   */
   abstract getMonthlyCourseEnrollmentStats(
    year: string
  ): Promise<{ month: number; count: number }[]>;


  /**
   * Returns a list of userIds enrolled in a course.
   */
  abstract listStudentIdsByCourse(courseId: string): Promise<string[]>;

  /**
   * Returns a list of unique userIds across all courses taught by the instructor.
   */
  abstract listStudentIdsByInstructor(instructorId: string): Promise<string[]>;

  /**
   * Returns a list of courseIds where the given student has enrolled.
   */
  abstract listCourseIdsByStudent(studentId: string): Promise<string[]>;

  /**
   * Returns all enrollments for a given user.
   */
  abstract listEnrollmentsByUser(
    userId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment[]>;

  /**
   * Returns all enrollments for a given course.
   */
  abstract listEnrollmentsByCourse(
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment[]>;

  /**
   * Find enrollment by enrollmentId and userId.
   */
  abstract getByIdAndUser(
    enrollmentId: string,
    userId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null>;

  /**
   * Remove an enrollment.
   */
  abstract remove(enrollment: Enrollment): Promise<void>;

  /**
   * Remove an enrollment.
   */
  abstract getRevenueStatus(year: string): Promise<RevenueStats>;
}
