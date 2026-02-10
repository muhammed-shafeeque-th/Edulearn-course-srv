import crypto from "crypto";
import { CourseStatus } from "src/domain/entities/course.entity";
import { CourseRelationOptions, GetCourseParams } from "src/domain/repositories/course.repository";

export const CACHE_KEYS = {
    course: {
        /**
         * Returns the Redis cache key for a course by its ID.
         * options are ignored, but included for future-proofing/type-compatibility.
         */
        byId: (id: string, _options?: CourseRelationOptions) => `course:${id}`,

        bySlug: (slug: string) => `course:slug:${slug}`,

        byTitle: (title: string) => `course:title:${title}`,

        byUser: (userId: string, page: number, limit: number, sortBy: string, sortOrder: string) =>
            `courses:user:${userId}:page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`,

        byInstructor: (instructorId: string, page?: number, limit?: number, sortBy?: string, sortOrder?: string) =>
            typeof page !== "undefined"
                ? `courses:instructor:${instructorId}:page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`
                : `courses:instructor:${instructorId}`,

        byIds: (ids: string[]) =>
            "courses:ids:" +
            crypto
                .createHash("sha256")
                .update([...new Set(ids)].sort().join(","))
                .digest("hex"),

        list: (params: Omit<GetCourseParams, "category" | "level"> & { category: string[]; level: string[] }) => {
            // Normalize all cache-relevant parameters, including sort and filters
            const { page, limit, status, sortBy, sortOrder, search, category, level, minPrice, maxPrice, rating } = params;
            const cacheObject = {
                page: page ?? 1,
                limit: limit ?? 10,
                status: status ?? CourseStatus.PUBLISHED,
                sortBy: sortBy ?? "createdAt",
                sortOrder: sortOrder ?? "DESC",
                search: search?.trim().toLowerCase() || null,
                category: [...new Set(category)].map((x) => x.trim()).sort(),
                level: [...new Set(level)].map((x) => x.trim()).sort(),
                minPrice: minPrice ?? null,
                maxPrice: maxPrice ?? null,
                rating: rating ?? null,
            };
            return (
                "courses:list:" +
                crypto
                    .createHash("sha256")
                    .update(JSON.stringify(cacheObject))
                    .digest("hex")
            );
        },

        instructorWildcard: (instructorId: string) => `courses:instructor:${instructorId}:*`,
    },
    section: {
        byId(id: string): string {
          return `section:${id}`;
        },
      
        byCourse(courseId: string): string {
          return `sections:course:${courseId}`;
        },
      
        invalidateKeys(sectionId: string, courseId: string): string[] {
          return [
            CACHE_KEYS.section.byId(sectionId),
            CACHE_KEYS.section.byCourse(courseId),
          ];
        },
    },
    lesson: {
        byId: (id: string) => `lesson:${id}`,
        bySection: (sectionId: string) => `lessons:section:${sectionId}`,
        byCourse: (courseId: string) => `lessons:course:${courseId}`,
    },
    quiz: {
        byId(id: string) {
            return `quiz:${id}`;
        },
        bySection(sectionId: string) {
            return `quiz:section:${sectionId}`;
        },
        byCourse(courseId: string) {
            return `quizzes:course:${courseId}`;
        },
        invalidateKeys(quizId: string, sectionId: string, courseId: string): string[] {
            return [
                CACHE_KEYS.quiz.byId(quizId),
                CACHE_KEYS.quiz.bySection(sectionId),
                CACHE_KEYS.quiz.byCourse(courseId),
            ];
        },
    },
    review: {
        byId: (id: string) => `review:${id}`,
        byCourse: (courseId: string) => `reviews:course:${courseId}`,
        byCourseWildcard: (courseId: string) => `reviews:course:${courseId}:*`, // Used for pattern-based cache invalidation if supported
        byUserAndCourse: (userId: string, courseId: string) => `review:user:${userId}:course:${courseId}`,
        byEnrollment: (enrollmentId: string) => `review:enrollment:${enrollmentId}`,
        courseRatingsBreakdown: (courseId: string) => `review:course:${courseId}:ratings_breakdown`,
        byCourseWithParams: (
            courseId: string,
            page: number,
            limit: number,
            sortBy: string,
            sortOrder: "ASC" | "DESC",
            minRating?: number
        ) =>
            `reviews:course:${courseId}:page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}:minRating:${minRating ?? "all"}`,
    },
    progress:
    {
        byId: (id: string): string => {
            return `progress:${id}`;
        },

        byEnrollment: (enrollmentId: string): string => {
            return `progress:enrollment:${enrollmentId}`;
        },

        byEnrollmentQuiz: (enrollmentId: string, quizId: string): string => {
            return `progress:enrollment:${enrollmentId}:quiz:${quizId}`;
        },

        byEnrollmentLesson(enrollmentId: string, lessonId: string): string {
            return `progress:enrollment:${enrollmentId}:lesson:${lessonId}`;
        },

        byInvalidateOnProgressChange(progressId: string, enrollmentId: string): string[] {
            const keys = [
                CACHE_KEYS.progress.byId(progressId),
                CACHE_KEYS.progress.byEnrollment(enrollmentId),
            ];
            return keys;
        }
    },
    certificate: {
        byId: (id: string) => `certificate:${id}`,
        byEnrollmentId: (enrollmentId: string) => `certificate:enrollment:${enrollmentId}`,
        byCertificateNumber: (certificateNumber: string) => `certificate:number:${certificateNumber}`,
        byUserId: (userId: string, offset: number = 0, limit: number = 10) =>
            `certificates:user:${userId}:offset:${offset}:limit:${limit}`,
        allByUserId: (userId: string) => `certificates:user:${userId}`,
    },
    enrollment: {
        byId: (id: string, opts: { includeCourse?: boolean; withProgress?: boolean } = {}) =>
            `enrollment:${id}:course:${!!opts.includeCourse}:progress:${!!opts.withProgress}`,
        byIdAndUser: (
            enrollmentId: string,
            studentId: string,
            opts: { includeCourse?: boolean; withProgress?: boolean } = {}
        ) =>
            `enrollment:user:${studentId}:enrollment:${enrollmentId}:course:${!!opts.includeCourse}:progress:${!!opts.withProgress}`,
        byUserAndCourse: (
            studentId: string,
            courseId: string,
            opts: { includeCourse?: boolean; withProgress?: boolean } = {}
        ) =>
            `enrollment:user:${studentId}:course:${courseId}:course:${!!opts.includeCourse}:progress:${!!opts.withProgress}`,
        byUser: (
            studentId: string,
            opts: { withCourse?: boolean; withProgress?: boolean } = {}
        ) =>
            `enrollments:user:${studentId}:course:${!!opts.withCourse}:progress:${!!opts.withProgress}:list`,
        byCourse: (
            courseId: string,
            opts: { withCourse?: boolean; withProgress?: boolean } = {}
        ) =>
            `enrollments:course:${courseId}:course:${!!opts.withCourse}:progress:${!!opts.withProgress}:list`,
        byUserOnly: (studentId: string) => `enrollments:user:${studentId}:*`,
        byCourseOnly: (courseId: string) => `enrollments:course:${courseId}:*`,
        byEnrollmentId: (enrollmentId: string) => `enrollment:${enrollmentId}:*`,
        byUserAndCoursePattern: (studentId: string, courseId: string) =>
            `enrollment:user:${studentId}:course:${courseId}:*`,
        courseIdsByStudent: (studentId: string) => `enrollments:user:${studentId}:course-ids`,
        studentIdsByCourse: (courseId: string) => `enrollments:course:${courseId}:student-ids`,
    },
    category: {
        all: 'categories:all',
        byId: (id: string) => `category:${id}`,
    },


}