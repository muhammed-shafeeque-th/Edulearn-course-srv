import { Module } from "@nestjs/common";
import { CourseOrmEntity } from "./entities/course.orm-entity";
import { ModuleOrmEntity } from "./entities/module.orm-entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfigService } from "../config/config.service";
import { LessonOrmEntity } from "./entities/lesson.orm-entity";
import { QuizOrmEntity } from "./entities/quiz.orm-entity";
import { EnrollmentOrmEntity } from "./entities/enrollment.orm-entity";
import { ProgressOrmEntity } from "./entities/progress.orm-entity";
import { ReviewOrmEntity } from "./entities/review.entity";
import { UserOrmEntity } from "./entities/user.entity";
import { CategoryOrmEntity } from "./entities/category-orm.entity";
import { AddSearchVectorIndex1762848672867 } from "./migrations/1762848672867-AddSearchVectorIndex";
import { CertificateOrmEntity } from "./entities/certificate-orm.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        type: "postgres",
        host: configService.databaseHost,
        port: Number(configService.databasePort),
        username: configService.databaseUsername,
        password: configService.databasePassword,
        database: configService.databaseName,
        autoLoadEntities: true, // Auto load entities registered with @Entity()
        synchronize: true || configService.nodeEnv !== "production", // Auto schema sync (dev only!)
        logging: configService.nodeEnv !== "production" || ["error"],
        retryAttempts: 5, // Increase if you want extra resilience during spikes
        retryDelay: 1500,
        extra: {
          max: 100, // Raise this (e.g., 100-200) based on app needs and DB limits
          min: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 25000,
          statement_timeout: 15000, // 10 seconds max/query; lower for highly async APIs
          query_timeout: 25000, // 15 seconds; adjust if you expect longer queries
          keepAlive: true,
        },
        migrations: [AddSearchVectorIndex1762848672867],
        // migrationsRun: true, // Uncomment to run migrations on startup (CI/CD or dev only)
      }),
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature([
      CourseOrmEntity,
      CategoryOrmEntity,
      UserOrmEntity,
      ModuleOrmEntity,
      CertificateOrmEntity,
      LessonOrmEntity,
      QuizOrmEntity,
      EnrollmentOrmEntity,
      ProgressOrmEntity,
      ReviewOrmEntity,
    ]),
  ],
  providers: [
    // MigrationRunnerProvider,
    CourseOrmEntity,
    CategoryOrmEntity,
    ModuleOrmEntity,
    CertificateOrmEntity,
    UserOrmEntity,
    LessonOrmEntity,
    QuizOrmEntity,
    EnrollmentOrmEntity,
    ProgressOrmEntity,
    ReviewOrmEntity,
  ],
  exports: [
    TypeOrmModule,
    CourseOrmEntity,
    ModuleOrmEntity,
    CertificateOrmEntity,
    UserOrmEntity,
    LessonOrmEntity,
    QuizOrmEntity,
    EnrollmentOrmEntity,
    ProgressOrmEntity,
    ReviewOrmEntity,
  ],
})
export class DatabaseEntityModule {}
