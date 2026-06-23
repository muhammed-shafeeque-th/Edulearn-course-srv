import { Module } from "@nestjs/common";
import { CourseGrpcController } from "./course-grpc.controller";
import { CourseModule } from "src/application/use-cases/course/course.module";
import { SectionModule } from "src/application/use-cases/section/section.module";
import { LessonModule } from "src/application/use-cases/lesson/lesson.module";
import { QuizModule } from "src/application/use-cases/quiz/quiz.module";
import { ProgressModule } from "src/application/use-cases/progress/progress.module";
import { ReviewModule } from "src/application/use-cases/review/review.module";
import { GrpcInfrastructureModule } from "src/infrastructure/grpc/grpc.module";
import { EnrollmentModule } from "src/application/use-cases/enrollment/enrollment.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { SectionGrpcController } from "./section-grpc.controller";
import { LessonGrpcController } from "./lesson-grpc.controller";
import { QuizGrpcController } from "./quiz-grpc.controller";
import { ReviewGrpcController } from "./review-grpc.controller";
import { EnrollmentGrpcController } from "./enrollment-grpc.controller";
import { ProgressGrpcController } from "./progress-grpc.controller";
import { CertificateModule } from "src/application/use-cases/certificate/certificate.module";
import { CertificateGrpcController } from "./certificate-grpc.controller";

@Module({
  imports: [
    // DatabaseRepositoryModule,
    KafkaModule,
    CourseModule,
    SectionModule,
    LessonModule,
    QuizModule,
    EnrollmentModule,
    ProgressModule,
    CertificateModule,
    ReviewModule,
    GrpcInfrastructureModule,
  ],
  controllers: [
    CourseGrpcController,
    SectionGrpcController,
    LessonGrpcController,
    CertificateGrpcController,
    QuizGrpcController,
    ReviewGrpcController,
    EnrollmentGrpcController,
    ProgressGrpcController,
  ],
})
export class GrpcPresentationModule {}
