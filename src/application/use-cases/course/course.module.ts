import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { CreateCourseUseCase } from "./create-course.use-case";
import { GetCourseUseCase } from "./get-course.use-case";
import { UpdateCourseUseCase } from "./update-course.use-case";
import { DeleteCourseUseCase } from "./delete-course.use-case";
import { GetCoursesByInstructorUseCase } from "./get-courses-by-instructor.use-case";
import { GetEnrolledCoursesUseCase } from "./get-enrolled-courses.use-case";
import { ListCoursesUseCase } from "./list-courses.use-case";
import { GetCourseBySlugUseCase } from "./get-course-by-slug.use-case";
import { GetCoursesByIdsUseCase } from "./get-course-by-ids.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { PublishCourseUseCase } from "./publish-course.use-case";
import { UnPublishCourseUseCase } from "./unpublish-course.use-case";
import { GetCoursesStatsUseCase } from "./get-courses-stats.use-case";
import { GetInstructorCoursesStatsUseCase } from "./get-instructor-courses-stats.use-case";
import { GetInstructorCourseRatingStatsUseCase } from "./get-instructor-course-rating-stats.use-case";
import { GetInstructorCourseRevenueSummeryUseCase } from "./get-instructor-course-revenue-summery.use-case";
import { GetMonthlyCoursesEnrollmentStatsUseCase } from "../enrollment/get-monthly-course-enrollment-summery.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    CreateCourseUseCase,
    GetCourseBySlugUseCase,
    GetCourseUseCase,
    ListCoursesUseCase,
    UpdateCourseUseCase,
    GetCoursesByIdsUseCase,
    DeleteCourseUseCase,
    PublishCourseUseCase,
    UnPublishCourseUseCase,
    GetCoursesByInstructorUseCase,
    GetEnrolledCoursesUseCase,
    GetCoursesStatsUseCase,
    GetInstructorCoursesStatsUseCase,
    GetInstructorCourseRatingStatsUseCase,
    GetInstructorCourseRevenueSummeryUseCase,
    GetMonthlyCoursesEnrollmentStatsUseCase,
  ],
  exports: [
    CreateCourseUseCase,
    GetCourseBySlugUseCase,
    GetCourseUseCase,
    ListCoursesUseCase,
    UpdateCourseUseCase,
    GetCoursesByIdsUseCase,
    DeleteCourseUseCase,
    PublishCourseUseCase,
    UnPublishCourseUseCase,
    GetCoursesByInstructorUseCase,
    GetEnrolledCoursesUseCase,
    GetCoursesStatsUseCase,
    GetInstructorCoursesStatsUseCase,
    GetInstructorCourseRatingStatsUseCase,
    GetInstructorCourseRevenueSummeryUseCase,
    GetMonthlyCoursesEnrollmentStatsUseCase,
  ],
})
export class CourseModule {}
