import { Module } from "@nestjs/common";
import { DatabaseEntityModule } from "./database-entity.module";
import { CourseTypeOrmRepository } from "./repositories/course-typeorm.repository";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { EnrollmentTypeOrmRepository } from "./repositories/enrollment-typeorm.reposity";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { LessonTypeOrmRepository } from "./repositories/lesson-typeorm.repository";
import { ModuleTypeOrmRepository } from "./repositories/module-typeorm.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ProgressTypeOrmRepository } from "./repositories/progress-typeorm.repository";
import { QuizTypeOrmRepository } from "./repositories/quiz-typeorm.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { ReviewTypeOrmRepository } from "./repositories/review-typeorm.repository";
import { RedisModule } from "../redis/redis.module";
import { UserTypeOrmRepository } from "./repositories/user-typeorm.repository";
import { ICategoryRepository } from "src/domain/repositories/category.repository";
import { CategoryTypeOrmRepository } from "./repositories/category-typeorm.respository";
import { ICertificateRepository } from "src/domain/repositories/certificate.repository";
import { CertificateTypeOrmRepository } from "./repositories/certificate-typeorm.repository";

@Module({
  imports: [DatabaseEntityModule, RedisModule],
  providers: [
    { provide: ICourseRepository, useClass: CourseTypeOrmRepository },
    { provide: IEnrollmentRepository, useClass: EnrollmentTypeOrmRepository },
    { provide: ICategoryRepository, useClass: CategoryTypeOrmRepository },
    { provide: ILessonRepository, useClass: LessonTypeOrmRepository },
    { provide: IModuleRepository, useClass: ModuleTypeOrmRepository },
    { provide: IProgressRepository, useClass: ProgressTypeOrmRepository },
    { provide: IQuizRepository, useClass: QuizTypeOrmRepository },
    { provide: ICertificateRepository, useClass: CertificateTypeOrmRepository },
    { provide: IReviewRepository, useClass: ReviewTypeOrmRepository },
    UserTypeOrmRepository,
  ],
  exports: [
    UserTypeOrmRepository,
    ICategoryRepository,
    DatabaseEntityModule,
    ICourseRepository,
    IEnrollmentRepository,
    ILessonRepository,
    ICertificateRepository,
    IModuleRepository,
    IProgressRepository,
    IQuizRepository,
    IReviewRepository,
  ],
})
export class DatabaseRepositoryModule {}
