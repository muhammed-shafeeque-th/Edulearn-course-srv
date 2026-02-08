import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { GetEnrollmentsByUserUseCase } from "./get-enrollment-by-user.use-case";
import { GetEnrollmentsByCourseUseCase } from "./get-enrollment-by-course.use-case";
import { UpdateEnrollmentUseCase } from "../progress/update-enrollment.use-case";
import { DeleteEnrollmentUseCase } from "./delete-enrollment.use-case";
import { GrpcInfrastructureModule } from "src/infrastructure/grpc/grpc.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GetEnrollmentDetailUseCase } from "./get-enrollment-detail-use-case";
import { CheckEnrollmentUseCase } from "./check-enrollment.use-case";
import { CheckCourseEnrollmentUseCase } from "./check-course-enrollment.use-case";
import { GetEnrollmentUseCase } from "./get-enrollment.use-case";
import { CreateEnrollmentFromOrderUseCase } from "./create-enrollment-from-order.use-case";
import { GetMonthlyCoursesEnrollmentStatsUseCase } from "./get-monthly-course-enrollment-summery.use-case";
import { GetInstructorCoursesEnrollmentSummeryUseCase } from "./get-courses-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentSummeryUseCase } from "./get-course-enrollment-summery.use-case";
import { GetInstructorCourseEnrollmentTrendUseCase } from "./get-course-enrollment-trend.use-case";
import { GetRevenueStatsUseCase } from "./get-revenue-stats.use-case";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule, GrpcInfrastructureModule],
  providers: [
    GetEnrollmentDetailUseCase,
    CreateEnrollmentFromOrderUseCase,
    GetEnrollmentUseCase,
    GetEnrollmentsByUserUseCase,
    CheckEnrollmentUseCase,
    CheckCourseEnrollmentUseCase,
    GetEnrollmentsByCourseUseCase,
    UpdateEnrollmentUseCase,
    DeleteEnrollmentUseCase,
    GetMonthlyCoursesEnrollmentStatsUseCase,
    GetInstructorCoursesEnrollmentSummeryUseCase,
    GetInstructorCourseEnrollmentSummeryUseCase,
    GetInstructorCourseEnrollmentTrendUseCase,
    GetRevenueStatsUseCase,
  ],
  exports: [
    GetEnrollmentDetailUseCase,
    CreateEnrollmentFromOrderUseCase,
    GetEnrollmentUseCase,
    GetEnrollmentsByUserUseCase,
    CheckEnrollmentUseCase,
    CheckCourseEnrollmentUseCase,
    GetEnrollmentsByCourseUseCase,
    UpdateEnrollmentUseCase,
    DeleteEnrollmentUseCase,
    GetMonthlyCoursesEnrollmentStatsUseCase,
    GetInstructorCoursesEnrollmentSummeryUseCase,
    GetInstructorCourseEnrollmentSummeryUseCase,
    GetInstructorCourseEnrollmentTrendUseCase,
    GetRevenueStatsUseCase,
  ],
})
export class EnrollmentModule {}
