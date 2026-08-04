import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
// import { GrpcInfrastructureModule } from "src/infrastructure/grpc/grpc.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { RedisModule } from "@/infrastructure/redis/redis.module";
// import { UpdateEnrollmentUseCase } from "../impls/progress/update-enrollment.use-case";
import { GetEnrollmentsByUserUseCase } from "./impls/get-enrollment-by-user.use-case";
import { GetEnrollmentsByCourseUseCase } from "./impls/get-enrollment-by-course.use-case";
import { DeleteEnrollmentUseCase } from "./impls/delete-enrollment.use-case";
import { GetEnrollmentDetailUseCase } from "./impls/get-enrollment-detail-use-case";
import { CheckEnrollmentUseCase } from "./impls/check-enrollment.use-case";
import { CheckCourseEnrollmentUseCase } from "./impls/check-course-enrollment.use-case";
import { GetEnrollmentUseCase } from "./impls/get-enrollment.use-case";
import { CreateEnrollmentFromOrderUseCase } from "./impls/create-enrollment-from-order.use-case";
import { GetMonthlyCoursesEnrollmentStatsUseCase } from "./impls/get-monthly-course-enrollment-summery.use-case";
import { GetInstructorCoursesEnrollmentSummeryUseCase } from "./impls/get-courses-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentSummeryUseCase } from "./impls/get-course-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentTrendUseCase } from "./impls/get-course-enrollment-trend.use-case";
import { GetRevenueStatsUseCase } from "./impls/get-revenue-stats.use-case";
import { GetEnrollmentTrendUseCase } from "./impls/get-enrollment-trend.use-case";
import { IGetEnrollmentsByUserUseCase } from "./interfaces/get-enrollment-by-user.interface";
import { IGetEnrollmentsByCourseUseCase } from "./interfaces/get-enrollment-by-course.interface";
import { IDeleteEnrollmentUseCase } from "./interfaces/delete-enrollment.interface";
import { IGetEnrollmentDetailUseCase } from "./interfaces/get-enrollment-detail.interface";
import { ICheckEnrollmentUseCase } from "./interfaces/check-enrollment.interface";
import { ICheckCourseEnrollmentUseCase } from "./interfaces/check-course-enrollment.interface";
import { IGetEnrollmentUseCase } from "./interfaces/get-enrollment.interface";
import { ICreateEnrollmentFromOrderUseCase } from "./interfaces/create-enrollment-from-order.interface";
import { IGetMonthlyCoursesEnrollmentStatsUseCase } from "./interfaces/get-monthly-course-enrollment-summery.interface";
import { IGetInstructorCoursesEnrollmentSummeryUseCase } from "./interfaces/get-courses-enrollment-summery.interface";
import { IGetInstructorCourseEnrollmentTrendUseCase } from "./interfaces/get-course-enrollment-trend.interface";
import { IGetRevenueStatsUseCase } from "./interfaces/get-revenue-stats.interface";
import { IGetEnrollmentTrendUseCase } from "./interfaces/get-enrollment-trend.interface";
import { IGetInstructorCourseEnrollmentSummeryUseCase } from "./interfaces/get-course-enrollment-summery.interface";

@Module({
  imports: [
    DatabaseRepositoryModule,
    RedisModule,
    KafkaModule,
    // GrpcInfrastructureModule,
  ],
  providers: [
    {
      provide: IGetEnrollmentDetailUseCase,
      useClass: GetEnrollmentDetailUseCase,
    },
    {
      provide: ICreateEnrollmentFromOrderUseCase,
      useClass: CreateEnrollmentFromOrderUseCase,
    },
    { provide: IGetEnrollmentUseCase, useClass: GetEnrollmentUseCase },
    {
      provide: IGetEnrollmentTrendUseCase,
      useClass: GetEnrollmentTrendUseCase,
    },
    {
      provide: IGetEnrollmentsByUserUseCase,
      useClass: GetEnrollmentsByUserUseCase,
    },
    { provide: ICheckEnrollmentUseCase, useClass: CheckEnrollmentUseCase },
    {
      provide: ICheckCourseEnrollmentUseCase,
      useClass: CheckCourseEnrollmentUseCase,
    },
    {
      provide: IGetEnrollmentsByCourseUseCase,
      useClass: GetEnrollmentsByCourseUseCase,
    },
    { provide: IDeleteEnrollmentUseCase, useClass: DeleteEnrollmentUseCase },
    {
      provide: IGetMonthlyCoursesEnrollmentStatsUseCase,
      useClass: GetMonthlyCoursesEnrollmentStatsUseCase,
    },
    {
      provide: IGetInstructorCoursesEnrollmentSummeryUseCase,
      useClass: GetInstructorCoursesEnrollmentSummeryUseCase,
    },
    {
      provide: IGetInstructorCourseEnrollmentSummeryUseCase,
      useClass: GetInstructorCourseEnrollmentSummeryUseCase,
    },
    {
      provide: IGetInstructorCourseEnrollmentTrendUseCase,
      useClass: GetInstructorCourseEnrollmentTrendUseCase,
    },
    { provide: IGetRevenueStatsUseCase, useClass: GetRevenueStatsUseCase },
  ],
  exports: [
    IGetEnrollmentDetailUseCase,
    ICreateEnrollmentFromOrderUseCase,
    IGetEnrollmentUseCase,
    IGetEnrollmentTrendUseCase,
    IGetEnrollmentsByUserUseCase,
    ICheckEnrollmentUseCase,
    ICheckCourseEnrollmentUseCase,
    IGetEnrollmentsByCourseUseCase,
    // UpdateEnrollmentUseCase,
    IDeleteEnrollmentUseCase,
    IGetMonthlyCoursesEnrollmentStatsUseCase,
    IGetInstructorCoursesEnrollmentSummeryUseCase,
    IGetInstructorCourseEnrollmentSummeryUseCase,
    IGetInstructorCourseEnrollmentTrendUseCase,
    IGetRevenueStatsUseCase,
  ],
})
export class EnrollmentModule {}
