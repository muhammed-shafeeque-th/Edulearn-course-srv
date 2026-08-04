import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
import { ICreateCourseUseCase } from "./interfaces/create-course.interface";
import { IGetCourseUseCase } from "./interfaces/get-course.interface";
import { IUpdateCourseUseCase } from "./interfaces/update-course.interface";
import { IDeleteCourseUseCase } from "./interfaces/delete-course.interface";
import { IGetCoursesByInstructorUseCase } from "./interfaces/get-courses-by-instructor.interface";
import { IGetEnrolledCoursesUseCase } from "./interfaces/get-enrolled-courses.interface";
import { IListCoursesUseCase } from "./interfaces/list-courses.interface";
import { IGetCourseBySlugUseCase } from "./interfaces/get-course-by-slug.interface";
import { IGetCoursesByIdsUseCase } from "./interfaces/get-course-by-ids.interface";
import { IPublishCourseUseCase } from "./interfaces/publish-course.interface";
import { IUnPublishCourseUseCase } from "./interfaces/unpublish-course.interface";
import { IGetCoursesStatsUseCase } from "./interfaces/get-courses-stats.interface";
import { IGetInstructorCoursesStatsUseCase } from "./interfaces/get-instructor-courses-stats.interface";
import { IGetInstructorCourseRatingStatsUseCase } from "./interfaces/get-instructor-course-rating-stats.interface";
import { IGetInstructorCourseRevenueSummeryUseCase } from "./interfaces/get-instructor-course-revenue-summery.interface";
import { CreateCourseUseCase } from "./impls/create-course.use-case";
import { GetCourseUseCase } from "./impls/get-course.use-case";
import { UpdateCourseUseCase } from "./impls/update-course.use-case";
import { DeleteCourseUseCase } from "./impls/delete-course.use-case";
import { GetCoursesByInstructorUseCase } from "./impls/get-courses-by-instructor.use-case";
import { GetEnrolledCoursesUseCase } from "./impls/get-enrolled-courses.use-case";
import { ListCoursesUseCase } from "./impls/list-courses.use-case";
import { GetCourseBySlugUseCase } from "./impls/get-course-by-slug.use-case";
import { GetCoursesByIdsUseCase } from "./impls/get-course-by-ids.use-case";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { PublishCourseUseCase } from "./impls/publish-course.use-case";
import { UnPublishCourseUseCase } from "./impls/unpublish-course.use-case";
import { GetCoursesStatsUseCase } from "./impls/get-courses-stats.use-case";
import { GetInstructorCoursesStatsUseCase } from "./impls/get-instructor-courses-stats.use-case";
import { GetInstructorCourseRatingStatsUseCase } from "./impls/get-instructor-course-rating-stats.use-case";
import { GetInstructorCourseRevenueSummeryUseCase } from "./impls/get-instructor-course-revenue-summery.use-case";
import { IGetMonthlyCoursesEnrollmentStatsUseCase } from "../enrollment/interfaces/get-monthly-course-enrollment-summery.interface";
import { GetMonthlyCoursesEnrollmentStatsUseCase } from "../enrollment/impls/get-monthly-course-enrollment-summery.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule],
  providers: [
    { provide: ICreateCourseUseCase, useClass: CreateCourseUseCase },
    { provide: IGetCourseBySlugUseCase, useClass: GetCourseBySlugUseCase },
    { provide: IGetCourseUseCase, useClass: GetCourseUseCase },
    { provide: IListCoursesUseCase, useClass: ListCoursesUseCase },
    { provide: IUpdateCourseUseCase, useClass: UpdateCourseUseCase },
    { provide: IGetCoursesByIdsUseCase, useClass: GetCoursesByIdsUseCase },
    { provide: IDeleteCourseUseCase, useClass: DeleteCourseUseCase },
    { provide: IPublishCourseUseCase, useClass: PublishCourseUseCase },
    { provide: IUnPublishCourseUseCase, useClass: UnPublishCourseUseCase },
    {
      provide: IGetCoursesByInstructorUseCase,
      useClass: GetCoursesByInstructorUseCase,
    },
    {
      provide: IGetEnrolledCoursesUseCase,
      useClass: GetEnrolledCoursesUseCase,
    },
    { provide: IGetCoursesStatsUseCase, useClass: GetCoursesStatsUseCase },
    {
      provide: IGetInstructorCoursesStatsUseCase,
      useClass: GetInstructorCoursesStatsUseCase,
    },
    {
      provide: IGetInstructorCourseRatingStatsUseCase,
      useClass: GetInstructorCourseRatingStatsUseCase,
    },
    {
      provide: IGetInstructorCourseRevenueSummeryUseCase,
      useClass: GetInstructorCourseRevenueSummeryUseCase,
    },
    {
      provide: IGetMonthlyCoursesEnrollmentStatsUseCase,
      useClass: GetMonthlyCoursesEnrollmentStatsUseCase,
    },
  ],
  exports: [
    ICreateCourseUseCase,
    IGetCourseBySlugUseCase,
    IGetCourseUseCase,
    IListCoursesUseCase,
    IUpdateCourseUseCase,
    IGetCoursesByIdsUseCase,
    IDeleteCourseUseCase,
    IPublishCourseUseCase,
    IUnPublishCourseUseCase,
    IGetCoursesByInstructorUseCase,
    IGetEnrolledCoursesUseCase,
    IGetCoursesStatsUseCase,
    IGetInstructorCoursesStatsUseCase,
    IGetInstructorCourseRatingStatsUseCase,
    IGetInstructorCourseRevenueSummeryUseCase,
    IGetMonthlyCoursesEnrollmentStatsUseCase,
  ],
})
export class CourseModule {}
