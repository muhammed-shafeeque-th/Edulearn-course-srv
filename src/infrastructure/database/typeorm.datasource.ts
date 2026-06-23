import "reflect-metadata";
import { DataSource } from "typeorm";
import { CourseOrmEntity } from "./entities/course.orm-entity";
import { SectionOrmEntity } from "./entities/section.orm-entity";
import { LessonOrmEntity } from "./entities/lesson.orm-entity";
import { QuizOrmEntity } from "./entities/quiz.orm-entity";
import { EnrollmentOrmEntity } from "./entities/enrollment.orm-entity";
import { ProgressOrmEntity } from "./entities/progress.orm-entity";
import { ReviewOrmEntity } from "./entities/review.entity";
import { UserOrmEntity } from "./entities/user.entity";
import { CategoryOrmEntity } from "./entities/category-orm.entity";
import { AddSearchVectorIndex1762848672867 } from "./migrations/1762848672867-AddSearchVectorIndex";
import { RenamedFieldsToSnakeCase1765791772101 } from "./migrations/1765791772101-RenamedFieldsToSnakeCase";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT || 5433),
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "password",
  database: process.env.DATABASE_NAME || "course_service",

  entities: [
    CourseOrmEntity,
    CategoryOrmEntity,
    UserOrmEntity,
    SectionOrmEntity,
    LessonOrmEntity,
    QuizOrmEntity,
    EnrollmentOrmEntity,
    ProgressOrmEntity,
    ReviewOrmEntity,
  ],

  migrations: [AddSearchVectorIndex1762848672867, RenamedFieldsToSnakeCase1765791772101],
  synchronize: false, // 🔒 NEVER true with migrations
  logging: ["error"],
});
