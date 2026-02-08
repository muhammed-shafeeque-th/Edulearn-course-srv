import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual, Brackets } from "typeorm";
import { EnrollmentOrmEntity } from "../entities/enrollment.orm-entity";
import {
  IEnrollmentRepository,
  InstructorCourseEnrollmentSummery,
  InstructorCourseEnrollmentTrend,
  InstructorCoursesEnrollmentSummery,
  RevenueStats,
} from "../../../domain/repositories/enrollment.repository";
import { Enrollment } from "../../../domain/entities/enrollment.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";
import { EnrollmentEntityMapper } from "../mappers/enrollment.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";

@Injectable()
export class EnrollmentTypeOrmRepository implements IEnrollmentRepository {
  constructor(
    @InjectRepository(EnrollmentOrmEntity)
    private readonly enrollmentRepo: Repository<EnrollmentOrmEntity>,

    @InjectRepository(ProgressOrmEntity)
    private readonly progressRepo: Repository<ProgressOrmEntity>,
    private readonly redisService: ICacheService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService
  ) { }

  async upsert(enrollment: Enrollment): Promise<void> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.upsert",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "INSERT/UPDATE",
            "enrollment.id": enrollment.getId(),
            "enrollment.course.id": enrollment.getCourseId(),
          });

          const ormEnrollment = EnrollmentEntityMapper.toOrmEnrollment(enrollment);

          const end = this.metrics.measureDBOperationDuration(
            "enrollment.save",
            "INSERT"
          );
          const savedEntity = await this.enrollmentRepo.save(ormEnrollment);
          end();
          this.metrics.incrementDBRequestCounter("INSERT");

          if (!savedEntity) {
            this.logger.warn(
              `Save operation returned null or undefined for enrollment ${enrollment.getId()}`,
              { ctx: EnrollmentTypeOrmRepository.name }
            );
          }

          // Cache invalidation
          const patterns = [
            CACHE_KEYS.enrollment.byEnrollmentId(enrollment.getId()),
            CACHE_KEYS.enrollment.byUserOnly(enrollment.getStudentId()),
            CACHE_KEYS.enrollment.byUserAndCoursePattern(
              enrollment.getStudentId(),
              enrollment.getCourseId()
            ),
            CACHE_KEYS.enrollment.byCourseOnly(enrollment.getCourseId()),
          ];
          await Promise.all(
            patterns.map((pattern) => this.redisService.delByPattern(pattern))
          );

          this.logger.debug(`Invalidated cache for enrollment ${enrollment.getId()}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
        } catch (err) {
          this.logger.error(
            `Error saving enrollment ${enrollment.getId()}: ${err}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw err;
        }
      }
    );
  }

  async getByIdAndUser(
    enrollmentId: string,
    studentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.findByIdAndUserId",
      async (span) => {
        const { includeCourse = false, includeProgressSummary = false } = options ?? {};
        const withProgress = includeProgressSummary;
        const cacheKey = CACHE_KEYS.enrollment.byIdAndUser(enrollmentId, studentId, {
          includeCourse,
          withProgress,
        });

        // Try cache
        const cached = await this.redisService.get<EnrollmentOrmEntity>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(
            `Cache hit for enrollmentId="${enrollmentId}" studentId="${studentId}"`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          return EnrollmentEntityMapper.toDomainEnrollment(cached, { withProgress });
        }
        span.setAttribute("cache.hit", false);

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.findByIdAndUserId",
          "SELECT"
        );
        const relations: string[] = [];
        if (includeCourse) {
          relations.push("course");
          relations.push("course.instructor");
        }
        if (withProgress) {
          relations.push("progressEntries");
        }
        const orm = await this.enrollmentRepo.findOne({
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

        await this.redisService.set(cacheKey, orm, 3600);
        this.logger.debug(
          `Cached enrollment for enrollmentId="${enrollmentId}" studentId="${studentId}"`,
          { ctx: EnrollmentTypeOrmRepository.name }
        );
        return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
      }
    );
  }

  async getById(
    enrollmentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null> {
    const { includeCourse = true, includeProgressSummary = false } = options ?? {};
    const withProgress = includeProgressSummary;
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.findById",
      async (span) => {
        const cacheKey = CACHE_KEYS.enrollment.byId(enrollmentId, {
          includeCourse,
          withProgress,
        });
        const cached = await this.redisService.get<EnrollmentOrmEntity>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for enrollment ${enrollmentId}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
          return EnrollmentEntityMapper.toDomainEnrollment(cached, { withProgress });
        }
        span.setAttribute("cache.hit", false);

        const relations: string[] = [];
        if (includeCourse) relations.push("course");
        if (includeProgressSummary) relations.push("progressEntries");

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.findById",
          "SELECT"
        );
        const orm = await this.enrollmentRepo.findOne({
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

        await this.redisService.set(cacheKey, orm, 3600);
        this.logger.debug(`Cached enrollment ${enrollmentId}`, {
          ctx: EnrollmentTypeOrmRepository.name,
        });

        return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
      }
    );
  }

  async findByUserId(
    studentId: string,
    options?: { withCourse?: boolean; withProgressSummary?: boolean }
  ): Promise<Enrollment[]> {
    const { withCourse = true, withProgressSummary = false } = options ?? {};
    const withProgress = withProgressSummary;

    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.findByUserId",
      async (span) => {
        const cacheKey = CACHE_KEYS.enrollment.byUser(studentId, { withCourse, withProgress });
        const cached = await this.redisService.get<EnrollmentOrmEntity[]>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for enrollments of user ${studentId}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
          return cached.map((e) =>
            EnrollmentEntityMapper.toDomainEnrollment(e, { withProgress })
          );
        }
        span.setAttribute("cache.hit", false);

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
          "SELECT"
        );
        const ormEntities = await this.enrollmentRepo.find({
          where: { studentId, deletedAt: null },
          relations,
          order: { createdAt: "DESC" },
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        await this.redisService.set(cacheKey, ormEntities, 600);

        return ormEntities.map((e) =>
          EnrollmentEntityMapper.toDomainEnrollment(e, { withProgress })
        );
      }
    );
  }

  async getByUserAndCourse(
    studentId: string,
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment | null> {
    const { includeCourse = true, includeProgressSummary = true } = options ?? {};
    const withProgress = includeProgressSummary;

    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.findByUserIdAndCourseId",
      async (span) => {
        const cacheKey = CACHE_KEYS.enrollment.byUserAndCourse(studentId, courseId, {
          includeCourse,
          withProgress,
        });
        const cached = await this.redisService.get<EnrollmentOrmEntity>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(
            `Cache hit for enrollment of user ${studentId} in course ${courseId}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          return EnrollmentEntityMapper.toDomainEnrollment(cached, { withProgress });
        }
        span.setAttribute("cache.hit", false);

        const relations: string[] = [];
        if (includeCourse) relations.push("course");
        if (withProgress) relations.push("progressEntries");

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.findByUserIdAndCourseId",
          "SELECT"
        );
        const orm = await this.enrollmentRepo.findOne({
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

        await this.redisService.set(cacheKey, orm, 3600);

        return EnrollmentEntityMapper.toDomainEnrollment(orm, { withProgress });
      }
    );
  }

  async remove(enrollment: Enrollment): Promise<void> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.delete",
      async (span) => {
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
            "UPDATE"
          );
          const result = await this.enrollmentRepo.save(orm);
          end();
          this.metrics.incrementDBRequestCounter("UPDATE");

          if (!result) {
            this.logger.warn(
              `Delete operation (save for softDelete) returned null or undefined for enrollment ${enrollment.getId()}`,
              { ctx: EnrollmentTypeOrmRepository.name }
            );
          }

          // Invalidate all related cache keys
          const patterns = [
            CACHE_KEYS.enrollment.byEnrollmentId(enrollment.getId()),
            CACHE_KEYS.enrollment.byUserAndCoursePattern(
              enrollment.getStudentId(),
              enrollment.getCourseId()
            ),
            CACHE_KEYS.enrollment.byUserOnly(enrollment.getStudentId()),
            CACHE_KEYS.enrollment.byCourseOnly(enrollment.getCourseId()),
          ];
          await Promise.all(
            patterns.map((pattern) => this.redisService.delByPattern(pattern))
          );
          span.setAttribute("cache.invalidated", true);
          this.logger.debug(
            `Invalidated cache for enrollment ${enrollment.getId()}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
        } catch (error) {
          this.logger.error(
            `Error during soft-delete for enrollment ${enrollment.getId()}: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  }

  async listCourseIdsByStudent(studentId: string): Promise<string[]> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.listCourseIdsByStudent",
      async (span) => {
        const end = this.metrics.measureDBOperationDuration(
          "enrollment.listCourseIdsByStudent",
          "SELECT"
        );
        const enrollments = await this.enrollmentRepo.find({
          where: { studentId, deletedAt: null },
          select: ["courseId"],
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");
        const courseIds = enrollments.map((e) => e.courseId);
        span.setAttribute("result.count", courseIds.length);
        return courseIds;
      }
    );
  }

  async listEnrollmentsByCourse(
    courseId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment[]> {
    const { includeCourse = true, includeProgressSummary = false } = options ?? {};
    const withProgress = includeProgressSummary;

    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.listEnrollmentsByCourse",
      async (span) => {
        const cacheKey = CACHE_KEYS.enrollment.byCourse(courseId, {
          withCourse: includeCourse,
          withProgress,
        });
        const cached = await this.redisService.get<EnrollmentOrmEntity[]>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for enrollments of course ${courseId}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
          return cached.map((entity) =>
            EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress })
          );
        }
        span.setAttribute("cache.hit", false);

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
          "SELECT"
        );
        const enrollments = await this.enrollmentRepo.find({
          where: { courseId, deletedAt: null },
          relations,
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        await this.redisService.set(cacheKey, enrollments, 600);

        return enrollments.map((entity) =>
          EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress })
        );
      }
    );
  }

  async listEnrollmentsByUser(
    studentId: string,
    options?: { includeCourse?: boolean; includeProgressSummary?: boolean }
  ): Promise<Enrollment[]> {
    const { includeCourse = true, includeProgressSummary = false } = options ?? {};
    const withProgress = includeProgressSummary;

    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.listEnrollmentsByUser",
      async (span) => {
        const cacheKey = CACHE_KEYS.enrollment.byUser(studentId, {
          withCourse: includeCourse,
          withProgress,
        });
        const cached = await this.redisService.get<EnrollmentOrmEntity[]>(cacheKey);
        if (cached) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for enrollments of user ${studentId}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
          return cached.map((entity) =>
            EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress })
          );
        }
        span.setAttribute("cache.hit", false);

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
          "SELECT"
        );
        const enrollments = await this.enrollmentRepo.find({
          where: { studentId, deletedAt: null },
          relations,
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        await this.redisService.set(cacheKey, enrollments, 600);

        return enrollments.map((entity) =>
          EnrollmentEntityMapper.toDomainEnrollment(entity, { withProgress })
        );
      }
    );
  }

  async listStudentIdsByCourse(courseId: string): Promise<string[]> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.listStudentIdsByCourse",
      async (span) => {
        const end = this.metrics.measureDBOperationDuration(
          "enrollment.listStudentIdsByCourse",
          "SELECT"
        );
        const enrollments = await this.enrollmentRepo.find({
          where: { courseId, deletedAt: null },
          select: ["studentId"],
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        const studentIds = enrollments.map((e) => e.studentId);
        span.setAttribute("result.count", studentIds.length);
        return studentIds;
      }
    );
  }

  async listStudentIdsByInstructor(instructorId: string): Promise<string[]> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.listStudentIdsByInstructor",
      async (span) => {
        const end = this.metrics.measureDBOperationDuration(
          "enrollment.listStudentIdsByInstructor",
          "SELECT"
        );
        // EnrollmentOrmEntity should have instructorId (populated through a join)
        // Doing a join to the course for this
        const enrollments = await this.enrollmentRepo
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
      }
    );
  }

  async getInstructorCourseEnrollmentSummery(
    instructorId: string,
    courseId: string
  ): Promise<InstructorCourseEnrollmentSummery | null> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.getInstructorCourseEnrollmentSummery",
      async (span) => {
        try {
          const end = this.metrics.measureDBOperationDuration(
            "instructorCourseEnrollmentSummary",
            "SELECT"
          );

          // Aggregate required fields in one go, using the correct progress column
          const result = await this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.id = :courseId", { courseId })
            .andWhere("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL")
            .select([
              "COUNT(DISTINCT enrollment.id) AS totalStudents",
              "AVG(enrollment.progressPercent) AS avgProgress",
              "SUM(CASE WHEN enrollment.progressPercent = 100 THEN 1 ELSE 0 END)/NULLIF(COUNT(DISTINCT enrollment.id),0) AS completionRate"
            ])
            .getRawOne();

          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          if (!result) return null;

          return {
            totalStudents: Number(result?.totalStudents ?? 0),
            completionRate: Number(result?.completionRate ?? 0),
            avgProgress: Number(result?.avgProgress ?? 0)
          };
        } catch (error) {
          this.logger.error(
            `Error in getInstructorCourseEnrollmentSummery: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  }

  async getInstructorCourseEnrollmentTrend(
    instructorId: string,
    courseId: string,
    from?: string,
    to?: string
  ): Promise<InstructorCourseEnrollmentTrend | null> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.getInstructorCourseEnrollmentTrend",
      async (span) => {
        try {
          const qb = this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.id = :courseId", { courseId })
            .andWhere("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL");

          if (from) qb.andWhere("enrollment.createdAt >= :from", { from });
          if (to) qb.andWhere("enrollment.createdAt <= :to", { to });

          qb.select([
            "DATE(enrollment.createdAt) as date",
            "COUNT(enrollment.id) as enrollments",
          ])
            .groupBy("date")
            .orderBy("date", "ASC");

          const raw = await qb.getRawMany();

          const trend: InstructorCourseEnrollmentTrend = {
            trend: raw.map((row: any) => ({
              date: row.date,
              enrollments: Number(row.enrollments),
            })),
          };
          return trend;
        } catch (error) {
          this.logger.error(
            `Error in getInstructorCourseEnrollmentTrend: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  }

  async getRevenueStatus(year: string): Promise<RevenueStats> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.getRevenueStatus",
      async (span) => {
        try {
          // Validate the year input (expecting a four-digit year)
          if (!/^\d{4}$/.test(year)) {
            throw new Error(`Invalid year parameter: ${year}`);
          }

          // Filter enrollments by year, group by date, and sum their revenue
          const qb = this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .where("enrollment.deletedAt IS NULL")
            .andWhere("YEAR(enrollment.createdAt) = :year", { year });

          qb.select([
            "DATE(enrollment.createdAt) as date",
            "SUM(enrollment.price) as revenue",
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
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  }

  async getInstructorCoursesEnrollmentSummery(
    instructorId: string
  ): Promise<InstructorCoursesEnrollmentSummery | null> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.getInstructorCoursesEnrollmentSummery",
      async (span) => {
        const activeSince = new Date();
        activeSince.setDate(activeSince.getDate() - 30);
        try {
          // Get aggregate stats for all instructor courses

          // Total students & active students (last 30 days)
          const studentStatsQb = this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL");

          const studentStats = await studentStatsQb
            // .select([
            //   "COUNT(DISTINCT enrollment.id) as totalStudents",
            //   `SUM(CASE WHEN enrollment.createdAt >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as activeStudents`
            // ])
            .select([
              "COUNT(DISTINCT enrollment.id) as totalStudents",
              `SUM(
                CASE 
                  WHEN enrollment.createdAt >= :activeSince
                  THEN 1 
                  ELSE 0 
                END
              ) as activeStudents`
            ])
            .setParameter("activeSince", activeSince)
            .getRawOne();

          // Average completion - use enrollment.progressPercent (or fallback as needed)
          const avgCompletionQb = this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL");

          const avgCompletionRaw = await avgCompletionQb
            .select([
              "AVG(enrollment.progressPercent) as avgCompletion"
            ])
            .getRawOne();

          //TODO: need to fetch from either order service or from payment service for Total earnings - here just using course.discountPrice instead (not correct) 
          const earningsQb = this.enrollmentRepo
            .createQueryBuilder("enrollment")
            .leftJoin("enrollment.course", "course")
            .where("course.instructorId = :instructorId", { instructorId })
            .andWhere("enrollment.deletedAt IS NULL");

          const earningsRaw = await earningsQb
            .select([
              "SUM(course.discountPrice) as totalEarnings"
            ])
            .getRawOne();

          const result: InstructorCoursesEnrollmentSummery = {
            totalStudents: Number(studentStats?.totalStudents ?? 0),
            avgCompletion: Number(avgCompletionRaw?.avgCompletion ?? 0),
            activeStudents: Number(studentStats?.activeStudents ?? 0),
            totalEarnings: Number(earningsRaw?.totalEarnings ?? 0),
          };

          return result;
        } catch (error) {
          this.logger.error(
            `Error in getInstructorCoursesEnrollmentSummery: ${error}`,
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  };

  async getMonthlyCourseEnrollmentStats(
    year: string
  ): Promise<{ month: number; count: number }[]> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.getMonthlyCourseEnrollmentStats",
      async (span) => {
        try {
          // Group by month for the given year
          const qb = this.enrollmentRepo
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
            { ctx: EnrollmentTypeOrmRepository.name }
          );
          throw error;
        }
      }
    );
  }

  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    return this.tracer.startActiveSpan(
      "EnrollmentTypeOrmRepository.findByCourseId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "enrollment.course.id": courseId,
        });

        // This one doesn't take course/progress options (legacy api)
        const cacheKey = `enrollments:course:${courseId}`;
        const cachedEnrollments = await this.redisService.get<EnrollmentOrmEntity[]>(cacheKey);

        if (cachedEnrollments) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for enrollments of course ${courseId}`, {
            ctx: EnrollmentTypeOrmRepository.name,
          });
          return cachedEnrollments.map((entity) =>
            EnrollmentEntityMapper.toDomainEnrollment(entity)
          );
        }
        span.setAttribute("cache.hit", false);

        const end = this.metrics.measureDBOperationDuration(
          "enrollment.findByCourseId",
          "SELECT"
        );
        const ormEntities = await this.enrollmentRepo.find({
          where: { courseId, deletedAt: null },
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        const enrollments = ormEntities.map((entity) =>
          EnrollmentEntityMapper.toDomainEnrollment(entity)
        );
        span.setAttribute("db.enrollment.course.count", enrollments.length);

        await this.redisService.set(cacheKey, ormEntities, 3600);
        this.logger.debug(`Cached enrollments for course ${courseId}`, {
          ctx: EnrollmentTypeOrmRepository.name,
        });
        span.setAttribute("cache.set", true);
        return enrollments;
      }
    );
  }
}
