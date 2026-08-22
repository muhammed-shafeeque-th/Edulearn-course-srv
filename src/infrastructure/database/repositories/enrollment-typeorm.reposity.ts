import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  MoreThanOrEqual,
  LessThanOrEqual,
  Brackets,
} from "typeorm";
import { EnrollmentOrmEntity } from "../entities/enrollment.orm-entity";
import {
  IEnrollmentRepository,
  InstructorCourseEnrollmentSummery,
  InstructorCourseEnrollmentTrend,
  InstructorCoursesEnrollmentSummery,
  InstructorCourseRevenueSummery,
  RevenueStats,
} from "../../../domain/repositories/enrollment.repository";
import { Enrollment } from "../../../domain/entities/enrollment.entity";
import { IMetricService } from "src/application/adaptors/metric.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";
import { EnrollmentEntityMapper } from "../mappers/enrollment.entity.mapper";
import { BaseRepository } from "./base.repository";

@Injectable()
export class EnrollmentTypeOrmRepository
  extends BaseRepository<Enrollment, EnrollmentOrmEntity>
  implements IEnrollmentRepository
{
  protected contextName: string = EnrollmentTypeOrmRepository.name;
  constructor(
    @InjectRepository(EnrollmentOrmEntity)
    repo: Repository<EnrollmentOrmEntity>,

    logger: ILoggerService,
    tracer: ITraceService,
    metrics: IMetricService,
  ) {
    super(repo, logger, tracer, metrics);
  }

  async upsert(enrollment: Enrollment): Promise<void> {
    return this.execute("upsert", async (span) => {
      try {
        span.setAttributes({
          "db.operation": "INSERT/UPDATE",
          "enrollment.id": enrollment.getId(),
          "enrollment.course.id": enrollment.getCourseId(),
        });

        const ormEnrollment =
          EnrollmentEntityMapper.toOrmEnrollment(enrollment);

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.save",
          "INSERT",
        );
        const savedEntity = await this.repo.save(ormEnrollment);
        end();
        this.metrics.incrementDBRequestCounter("INSERT");

        if (!savedEntity) {
          this.logger.warn(
            `Save operation returned null or undefined for enrollment ${enrollment.getId()}`,
            { ctx: EnrollmentTypeOrmRepository.name },
          );
        }
      } catch (err) {
        this.logger.error(
          `Error saving enrollment ${enrollment.getId()}: ${err}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw err;
      }
    });
  }

  async findByIdAndUser(
    enrollmentId: string,
    studentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean },
  ): Promise<Enrollment | null> {
    return this.execute("findByIdAndUserId", async (span) => {
      const { includeCourse = false, includeProgressSummary = false } =
        options ?? {};
      const withProgress = includeProgressSummary;

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.findByIdAndUserId",
        "SELECT",
      );
      const relations: string[] = [];
      if (includeCourse) {
        relations.push("course");
        relations.push("course.instructor");
      }
      if (withProgress) {
        relations.push("progressEntries");
      }
      const orm = await this.repo.findOne({
        where: {
          id: enrollmentId,
          studentId,
          deletedAt: null,
        },
        relations,
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      if (!orm) {
        span.setAttribute("db.found", false);
        return null;
      }
      span.setAttribute("db.found", true);

      return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
    });
  }

  async findById(
    enrollmentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean },
  ): Promise<Enrollment | null> {
    const { includeCourse = true, includeProgressSummary = false } =
      options ?? {};
    const withProgress = includeProgressSummary;
    return this.execute("findById", async (span) => {
      const relations: string[] = [];
      if (includeCourse) relations.push("course");
      if (includeProgressSummary) relations.push("progressEntries");

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.findById",
        "SELECT",
      );
      const orm = await this.repo.findOne({
        where: { id: enrollmentId, deletedAt: null },
        relations,
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      if (!orm) {
        span.setAttribute("db.found", false);
        return null;
      }
      span.setAttribute("db.found", true);

      return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
    });
  }

  async findByUserId(
    studentId: string,
    options?: { withCourse?: boolean; withProgressSummary?: boolean },
  ): Promise<Enrollment[]> {
    const { withCourse = true, withProgressSummary = false } = options ?? {};
    const withProgress = withProgressSummary;

    return this.execute("findByUserId", async (span) => {
      const relations: string[] = [];
      if (withCourse) {
        relations.push("course");
        relations.push("course.instructor");
      }
      if (withProgress) {
        relations.push("progressEntries");
      }

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.findByUserId",
        "SELECT",
      );
      const ormEntities = await this.repo.find({
        where: { studentId, deletedAt: null },
        relations,
        order: { createdAt: "DESC" },
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      return ormEntities.map((e) =>
        EnrollmentEntityMapper.toDomainEnrollment(e, { withProgress }),
      );
    });
  }

  async findByUserAndCourse(
    studentId: string,
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean },
  ): Promise<Enrollment | null> {
    const { includeCourse = true, includeProgressSummary = true } =
      options ?? {};
    const withProgress = includeProgressSummary;

    return this.execute("findByUserIdAndCourseId", async (span) => {
      const relations: string[] = [];
      if (includeCourse) relations.push("course");
      if (withProgress) relations.push("progressEntries");

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.findByUserIdAndCourseId",
        "SELECT",
      );
      const orm = await this.repo.findOne({
        where: { studentId, courseId, deletedAt: null },
        relations,
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      if (!orm) {
        span.setAttribute("db.found", false);
        return null;
      }
      span.setAttribute("db.found", true);

      return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
    });
  }

  async remove(enrollment: Enrollment): Promise<void> {
    return this.execute("delete", async (span) => {
      try {
        enrollment.softDelete();
        const orm = EnrollmentEntityMapper.toOrmEnrollment(enrollment);

        span.setAttributes({
          "db.operation": "DELETE",
          "enrollment.id": enrollment.getId(),
          "enrollment.course.id": enrollment.getCourseId(),
        });

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.delete",
          "UPDATE",
        );
        const result = await this.repo.save(orm);
        end();
        this.metrics.incrementDBRequestCounter("UPDATE");

        if (!result) {
          this.logger.warn(
            `Delete operation (save for softDelete) returned null or undefined for enrollment ${enrollment.getId()}`,
            { ctx: EnrollmentTypeOrmRepository.name },
          );
        }
      } catch (error) {
        this.logger.error(
          `Error during soft-delete for enrollment ${enrollment.getId()}: ${error}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw error;
      }
    });
  }

  async listCourseIdsByStudent(studentId: string): Promise<string[]> {
    return this.execute("listCourseIdsByStudent", async (span) => {
      const end = this.metrics.measureDBOperationDuration(
        "enrollment.listCourseIdsByStudent",
        "SELECT",
      );
      const enrollments = await this.repo.find({
        where: { studentId, deletedAt: null },
        select: ["courseId"],
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");
      const courseIds = enrollments.map((e) => e.courseId);
      span.setAttribute("result.count", courseIds.length);
      return courseIds;
    });
  }

  async listEnrollmentsByCourse(
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean },
  ): Promise<Enrollment[]> {
    const { includeCourse = true, includeProgressSummary = false } =
      options ?? {};
    const withProgress = includeProgressSummary;

    return this.execute("listEnrollmentsByCourse", async (span) => {
      const relations: string[] = [];
      if (includeCourse) {
        relations.push("course");
        relations.push("course.instructor");
      }
      if (withProgress) {
        relations.push("progressEntries");
      }

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.listEnrollmentsByCourse",
        "SELECT",
      );
      const enrollments = await this.repo.find({
        where: { courseId, deletedAt: null },
        relations,
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      return enrollments.map((entity) =>
        EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress }),
      );
    });
  }

  async listEnrollmentsByUser(
    studentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean },
  ): Promise<Enrollment[]> {
    const { includeCourse = true, includeProgressSummary = false } =
      options ?? {};
    const withProgress = includeProgressSummary;

    return this.execute("listEnrollmentsByUser", async (span) => {
      const relations: string[] = [];
      if (includeCourse) {
        relations.push("course");
        relations.push("course.instructor");
      }
      if (withProgress) {
        relations.push("progressEntries");
      }

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.listEnrollmentsByUser",
        "SELECT",
      );
      const enrollments = await this.repo.find({
        where: { studentId, deletedAt: null },
        relations,
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      return enrollments.map((entity) =>
        EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress }),
      );
    });
  }

  async listStudentIdsByCourse(courseId: string): Promise<string[]> {
    return this.execute("listStudentIdsByCourse", async (span) => {
      const end = this.metrics.measureDBOperationDuration(
        "enrollment.listStudentIdsByCourse",
        "SELECT",
      );
      const enrollments = await this.repo.find({
        where: { courseId, deletedAt: null },
        select: ["studentId"],
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      const studentIds = enrollments.map((e) => e.studentId);
      span.setAttribute("result.count", studentIds.length);
      return studentIds;
    });
  }

  async listStudentIdsByInstructor(instructorId: string): Promise<string[]> {
    return this.execute("listStudentIdsByInstructor", async (span) => {
      const end = this.metrics.measureDBOperationDuration(
        "enrollment.listStudentIdsByInstructor",
        "SELECT",
      );
      // EnrollmentOrmEntity should have instructorId (populated through a join)
      // Doing a join to the course for this
      const enrollments = await this.repo
        .createQueryBuilder("enrollment")
        .leftJoin("enrollment.course", "course")
        .where("course.instructorId = :instructorId", { instructorId })
        .andWhere("enrollment.deletedAt IS NULL")
        .select("enrollment.studentId")
        .getMany();

      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      const studentIds = enrollments.map((e) => e.studentId);
      span.setAttribute("result.count", studentIds.length);
      return Array.from(new Set(studentIds));
    });
  }

  async getInstructorCourseEnrollmentSummery(
    instructorId: string,
    courseId: string,
  ): Promise<InstructorCourseEnrollmentSummery | null> {
    return this.execute(
      "getInstructorCourseEnrollmentSummery",
      async (span) => {
        try {
          const end = this.metrics.measureDBOperationDuration(
            "instructorCourseEnrollmentSummary",
            "SELECT",
          );

          const now = new Date();
          const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );
          const prevMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
          );

          // Aggregate required fields in one go, using the correct progress column
          const result = await this.repo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.id = :courseId", { courseId })
            .andWhere("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL")
            .select([
              "COUNT(DISTINCT enrollment.id) AS total_students",
              "AVG(enrollment.progressPercent) AS avg_progress",
              "COALESCE(SUM(CASE WHEN enrollment.progressPercent = 100 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(DISTINCT enrollment.id), 0) * 100, 0) AS completion_rate",
              "SUM(CASE WHEN enrollment.createdAt >= :currentMonthStart THEN 1 ELSE 0 END) AS current_month",
              "SUM(CASE WHEN enrollment.createdAt >= :prevMonthStart AND enrollment.createdAt < :currentMonthStart THEN 1 ELSE 0 END) AS prev_month",
            ])
            .setParameters({ currentMonthStart, prevMonthStart })
            .getRawOne();

          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          if (!result) return null;

          const currentMonth = Number(result.current_month || 0);
          const prevMonth = Number(result.prev_month || 0);
          let enrollmentGrowth = 0;

          if (prevMonth > 0) {
            enrollmentGrowth = ((currentMonth - prevMonth) / prevMonth) * 100;
          } else if (currentMonth > 0) {
            enrollmentGrowth = 100;
          }

          return {
            totalStudents: Number(result.total_students || 0),
            completionRate: Number(result.completion_rate || 0),
            avgProgress: Number(result.avg_progress || 0),
            enrollmentGrowth: Math.round(enrollmentGrowth),
          };
        } catch (error) {
          this.logger.error(
            `Error in getInstructorCourseEnrollmentSummery: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name },
          );
          throw error;
        }
      },
    );
  }

  async getInstructorCourseEnrollmentTrend(
    instructorId: string,
    courseId: string,
    from?: string,
    to?: string,
  ): Promise<InstructorCourseEnrollmentTrend | null> {
    return this.execute("getInstructorCourseEnrollmentTrend", async (span) => {
      try {
        const qb = this.repo
          .createQueryBuilder("enrollment")
          .leftJoin("enrollment.course", "course")
          .where("course.id = :courseId", { courseId })
          .andWhere("course.instructorId = :instructorId", { instructorId })
          .andWhere("enrollment.deletedAt IS NULL");

        if (from) qb.andWhere("enrollment.createdAt >= :from", { from });
        if (to) qb.andWhere("enrollment.createdAt <= :to", { to });

        qb.select([
          "EXTRACT(MONTH FROM enrollment.createdAt) AS month",
          "COUNT(enrollment.id) AS enrollments",
        ])
          .groupBy("month")
          .orderBy("month", "ASC");

        const raw = await qb.getRawMany();

        const trendData = new Array(12).fill(0).map((_, i) => ({
          month: i,
          enrollments: 0,
        }));

        raw.forEach((row: any) => {
          const m = Number(row.month) - 1; // 1-indexed to 0-indexed
          if (m >= 0 && m < 12) {
            trendData[m].enrollments = Number(row.enrollments);
          }
        });

        const trend: InstructorCourseEnrollmentTrend = {
          trend: trendData,
        };
        return trend;
      } catch (error) {
        this.logger.error(
          `Error in getInstructorCourseEnrollmentTrend: ${error}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw error;
      }
    });
  }
  async getEnrollmentTrend(
    year: number,
  ): Promise<InstructorCourseEnrollmentTrend | null> {
    return this.execute("getEnrollmentTrend", async (span) => {
      try {
        const qb = this.repo
          .createQueryBuilder("enrollment")
          .select("EXTRACT(MONTH FROM enrollment.createdAt) AS month")
          .addSelect("COUNT(enrollment.id)", "enrollments")
          .where("EXTRACT(YEAR FROM enrollment.createdAt) = :year", { year })
          .andWhere("enrollment.deletedAt IS NULL")
          .groupBy("month")
          .orderBy("month", "ASC");

        const raw = await qb.getRawMany();

        const trendData = new Array(12).fill(0).map((_, i) => ({
          month: i,
          enrollments: 0,
        }));

        raw.forEach((row: any) => {
          const m = Number(row.month) - 1; // 1-indexed to 0-indexed
          if (m >= 0 && m < 12) {
            trendData[m].enrollments = Number(row.enrollments);
          }
        });

        const trend: InstructorCourseEnrollmentTrend = {
          trend: trendData,
        };
        return trend;
      } catch (error) {
        this.logger.error(`Error in getEnrollmentTrend: ${error}`, {
          ctx: EnrollmentTypeOrmRepository.name,
        });
        throw error;
      }
    });
  }

  async getRevenueStatus(year: string): Promise<RevenueStats> {
    return this.execute("getRevenueStatus", async (span) => {
      try {
        // Validate the year input (expecting a four-digit year)
        if (!/^\d{4}$/.test(year)) {
          throw new Error(`Invalid year parameter: ${year}`);
        }

        // Filter enrollments by year, group by date, and sum their revenue
        const qb = this.repo
          .createQueryBuilder("enrollment")
          .leftJoin("enrollment.course", "course")
          .where("enrollment.deletedAt IS NULL")
          .andWhere("EXTRACT(YEAR FROM enrollment.createdAt) = :year", {
            year,
          });

        qb.select([
          "CAST(enrollment.createdAt AS DATE) as date",
          "SUM(COALESCE(course.discountPrice, course.price)) as revenue",
        ])
          .groupBy("date")
          .orderBy("date", "ASC");

        const raw = await qb.getRawMany();

        // Return stats as an array of {date, revenue}
        const stats = raw.map((row: any) => ({
          date: new Date(row.date).getTime(),
          revenue: Number(row.revenue || 0),
        }));

        return { stats };
      } catch (error) {
        this.logger.error(
          `Error in getRevenueStatus: ${error instanceof Error ? error.message : error}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw error;
      }
    });
  }

  async getInstructorCoursesEnrollmentSummery(
    instructorId: string,
  ): Promise<InstructorCoursesEnrollmentSummery | null> {
    return this.execute(
      "getInstructorCoursesEnrollmentSummery",
      async (span) => {
        const activeSince = new Date();
        activeSince.setDate(activeSince.getDate() - 30);
        const now = new Date();
        const currentMonthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        const prevMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );

        try {
          // Total students & active students (last 30 days)
          const stats = await this.repo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL")
            .select("COUNT(DISTINCT enrollment.id)", "total_students")
            .addSelect(
              `SUM(CASE WHEN enrollment.createdAt >= :activeSince THEN 1 ELSE 0 END)`,
              "active_students",
            )
            .addSelect("AVG(enrollment.progressPercent)", "avg_completion")
            .addSelect("SUM(course.discountPrice)", "total_earnings")
            .addSelect(
              "SUM(CASE WHEN enrollment.createdAt >= :currentMonthStart THEN 1 ELSE 0 END)",
              "current_month",
            )
            .addSelect(
              "SUM(CASE WHEN enrollment.createdAt >= :prevMonthStart AND enrollment.createdAt < :currentMonthStart THEN 1 ELSE 0 END)",
              "prev_month",
            )
            .setParameters({ activeSince, currentMonthStart, prevMonthStart })
            .getRawOne();

          if (!stats) return null;

          const parse = (val: any) => (val ? Number(val) : 0);

          const totalStudents = parse(stats.total_students);
          const activeStudents = parse(stats.active_students);
          const avgCompletion = parse(stats.avg_completion);
          const totalEarnings = parse(stats.total_earnings);
          const currentMonth = parse(stats.current_month);
          const prevMonth = parse(stats.prev_month);

          let enrollmentGrowth = 0;
          if (prevMonth > 0) {
            enrollmentGrowth = ((currentMonth - prevMonth) / prevMonth) * 100;
          } else if (currentMonth > 0) {
            enrollmentGrowth = 100;
          }

          return {
            totalStudents,
            avgCompletion,
            activeStudents,
            totalEarnings,
            enrollmentGrowth: Math.round(enrollmentGrowth),
          };
        } catch (error) {
          this.logger.error(
            `Error in getInstructorCoursesEnrollmentSummery: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name },
          );
          throw error;
        }
      },
    );
  }

  async getMonthlyCourseEnrollmentStats(
    year: string,
  ): Promise<{ month: number; count: number }[]> {
    return this.execute("getMonthlyCourseEnrollmentStats", async (span) => {
      try {
        // Group by month for the given year
        const qb = this.repo
          .createQueryBuilder("enrollment")
          .where("YEAR(enrollment.createdAt) = :year", { year })
          .andWhere("enrollment.deletedAt IS NULL")
          .select([
            "MONTH(enrollment.createdAt) as month",
            "COUNT(enrollment.id) as count",
          ])
          .groupBy("month")
          .orderBy("month", "ASC");

        const raw = await qb.getRawMany();

        return raw.map((row: any) => ({
          month: Number(row.month),
          count: Number(row.count),
        }));
      } catch (error) {
        this.logger.error(
          `Error in getMonthlyCourseEnrollmentStats: ${error}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw error;
      }
    });
  }

  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    return this.execute("findByCourseId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "enrollment.course.id": courseId,
      });

      const end = this.metrics.measureDBOperationDuration(
        "enrollment.findByCourseId",
        "SELECT",
      );
      const ormEntities = await this.repo.find({
        where: { courseId, deletedAt: null },
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      const enrollments = ormEntities.map((entity) =>
        EnrollmentEntityMapper.toDomainEnrollment(entity),
      );
      span.setAttribute("db.enrollment.course.count", enrollments.length);

      return enrollments;
    });
  }

  async getInstructorCourseRevenueSummery(
    instructorId: string,
    courseId: string,
  ): Promise<InstructorCourseRevenueSummery | null> {
    return this.execute("getInstructorCourseRevenueSummery", async (span) => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      try {
        const stats = await this.repo
          .createQueryBuilder("enrollment")
          .leftJoin("enrollment.course", "course")
          .where("course.id = :courseId", { courseId })
          .andWhere("course.instructorId = :instructorId", { instructorId })
          .andWhere("enrollment.deletedAt IS NULL")
          .select(
            "SUM(COALESCE(course.discountPrice, course.price))",
            "total_revenue",
          )
          .addSelect(
            "AVG(COALESCE(course.discountPrice, course.price))",
            "avg_revenue",
          )
          .addSelect(
            "SUM(CASE WHEN enrollment.createdAt >= :currentMonthStart THEN COALESCE(course.discountPrice, course.price) ELSE 0 END)",
            "this_month_revenue",
          )
          .addSelect(
            "SUM(CASE WHEN enrollment.createdAt >= :prevMonthStart AND enrollment.createdAt < :currentMonthStart THEN COALESCE(course.discountPrice, course.price) ELSE 0 END)",
            "prev_month_revenue",
          )
          .setParameters({ currentMonthStart, prevMonthStart })
          .getRawOne();

        if (!stats) return null;

        const parse = (val: any) => (val ? Number(val) : 0);

        const totalRevenue = parse(stats.total_revenue);
        const avgRevenue = parse(stats.avg_revenue);
        const thisMonthRevenue = parse(stats.this_month_revenue);
        const prevMonthRevenue = parse(stats.prev_month_revenue);

        let revenueGrowth = 0;
        if (prevMonthRevenue > 0) {
          revenueGrowth =
            ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
        } else if (thisMonthRevenue > 0) {
          revenueGrowth = 100;
        }

        return {
          totalRevenue,
          avgRevenue,
          thisMonthRevenue,
          revenueGrowth: Math.round(revenueGrowth),
        };
      } catch (error) {
        this.logger.error(
          `Error in getInstructorCourseRevenueSummery: ${error}`,
          { ctx: EnrollmentTypeOrmRepository.name },
        );
        throw error;
      }
    });
  }
}
