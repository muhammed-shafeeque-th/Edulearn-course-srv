import { Module } from "@nestjs/common";
import { CourseGrpcController } from "./course-grpc.controller";
import { CourseModule } from "src/application/use-cases/course/course.module";
import { ModuleModule } from "src/application/use-cases/module/module.module";
import { LessonModule } from "src/application/use-cases/lesson/lesson.module";
import { QuizModule } from "src/application/use-cases/quiz/quiz.module";
import { ProgressModule } from "src/application/use-cases/progress/progress.module";
import { ReviewModule } from "src/application/use-cases/review/review.module";
// import { GrpcInfrastructureModule } from "src/infrastructure/grpc/grpc.module";
import { EnrollmentModule } from "src/application/use-cases/enrollment/enrollment.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { ModuleGrpcController } from "./module-grpc.controller";
import { LessonGrpcController } from "./lesson-grpc.controller";
import { QuizGrpcController } from "./quiz-grpc.controller";
import { ReviewGrpcController } from "./review-grpc.controller";
import { EnrollmentGrpcController } from "./enrollment-grpc.controller";
import { ProgressGrpcController } from "./progress-grpc.controller";
import { CertificateModule } from "src/application/use-cases/certificate/certificate.module";
import { CertificateGrpcController } from "./certificate-grpc.controller";
import { CategoryModule } from "src/application/use-cases/category/category.module";
import { CategoryGrpcController } from "./category-grpc.controller";

@Module({
  imports: [
    // DatabaseRepositoryModule,
    KafkaModule,
    CourseModule,
    ModuleModule,
    LessonModule,
    QuizModule,
    EnrollmentModule,
    ProgressModule,
    CertificateModule,
    ReviewModule,
    CategoryModule,
  ],
  controllers: [
    CourseGrpcController,
    ModuleGrpcController,
    LessonGrpcController,
    CertificateGrpcController,
    QuizGrpcController,
    ReviewGrpcController,
    EnrollmentGrpcController,
    ProgressGrpcController,
    CategoryGrpcController,
  ],
})
export class GrpcPresentationModule {}
