import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, EntityManager, Repository, DataSource } from "typeorm";
import crypto from "crypto";
import { CourseOrmEntity } from "../entities/course.orm-entity";
import {
  CourseRelationOptions,
  GetCourseParams,
  ICourseRepository,
  InstructorCoursesStats,
} from "src/domain/repositories/course.repository";
import {
  Course,
  CourseMetadata,
  CourseStatus,
} from "src/domain/entities/course.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { CourseEntityMapper } from "../mappers/course.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";

@Injectable()
export class CourseTypeOrmRepository implements ICourseRepository {
  constructor(
    @InjectRepository(CourseOrmEntity)
    private readonly repo: Repository<CourseOrmEntity>,
    private readonly redisService: ICacheService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService,
    private readonly dataSource: DataSource,
  ) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<Course | null> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findByIdempotencyKey",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          idempotencyKey: idempotencyKey,
        });

        this.metrics.incrementDBRequestCounter("SELECT");
        const end = this.metrics.measureDBOperationDuration(
          "course.findByIdempotencyKey",
          "SELECT",
        );

        const ormCourse = await this.repo.findOne({
          where: { idempotencyKey },
          relations: {
            modules: {
              lessons: true,
              quiz: true,
            },
            instructor: true,
          },
        });

        end();

        if (!ormCourse) {
          this.logger.debug(
            `No course found for idempotencyKey: ${idempotencyKey}`,
            { ctx: CourseTypeOrmRepository.name },
          );
          return null;
        }
        return CourseEntityMapper.toDomainCourse(ormCourse);
      },
    );
  }

  async save(course: Course): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.save",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "course.title": course.getTitle(),
        });
        const ormEntity = CourseEntityMapper.toOrmCourse(course);

        this.metrics.incrementDBRequestCounter("INSERT");
        const end = this.metrics.measureDBOperationDuration(
          "course.save",
          "INSERT",
        );

        try {
          const saved = await this.repo.save(ormEntity);
          end();
          if (!saved || !saved.id) {
            this.logger.warn(
              `Save operation appears to have failed for course: ${course.getId()}`,
              { ctx: CourseTypeOrmRepository.name },
            );
          }
        } catch (err) {
          end();
          this.logger.warn(
            `Exception while saving course: ${course.getId()}, error: ${err?.message}`,
            { ctx: CourseTypeOrmRepository.name, error: err },
          );
          throw err;
        }

        // Invalidate related cache keys via central keys
        await Promise.allSettled([
          this.redisService.del(CACHE_KEYS.course.byId(course.getId())),
          this.redisService.del(CACHE_KEYS.course.bySlug(course.getSlug())),
          this.redisService.del(CACHE_KEYS.course.byTitle(course.getTitle())),
          this.redisService.delByPattern(
            CACHE_KEYS.course.instructorWildcard(course.getInstructorId()),
          ),
        ]);

        this.logger.debug(`Invalidated cache for course ${course.getId()}`, {
          ctx: CourseTypeOrmRepository.name,
        });
      },
    );
  }

  // async transaction<T>(callback: (manager: EntityManager) => Promise<T>) {
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const result = await callback(queryRunner.manager);

  //     await queryRunner.commitTransaction();
  //     return result;
  //   } catch (err) {
  //     await queryRunner.rollbackTransaction();
  //     throw err;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  /**
   * Executes the provided callback function inside a TypeORM transaction,
   * using the repository's injected DataSource.
   * Properly manages connection/transaction lifecycle & rollback on errors.
   */
  async transaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(callback);
  }

  async update(course: Course): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.update",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "UPDATE",
            "course.id": course.getId(),
            "course.title": course.getTitle(),
          });

          this.metrics.incrementDBRequestCounter("UPDATE");
          const end = this.metrics.measureDBOperationDuration(
            "course.update",
            "UPDATE",
          );

          // Prepare the update payload based only on domain object's current state.
          const updatePayload = CourseEntityMapper.toOrmCourse(course);

          // Attempt the update and check result for success
          const result = await this.repo.update(
            { id: course.getId() },
            updatePayload,
          );

          end();

          if (!result || result.affected === undefined) {
            const message = `Update result malformed for course id ${course.getId()}. Potential write failure.`;
            this.logger.warn(message, {
              ctx: CourseTypeOrmRepository.name,
              result,
            });
            span.setAttribute("course.updated", false);
            throw new Error(message);
          }

          if (result.affected === 0) {
            const message = `Course with id ${course.getId()} not found to update.`;
            this.logger.warn(message, { ctx: CourseTypeOrmRepository.name });
            span.setAttribute("course.updated", false);
            throw new Error(message);
          }

          span.setAttribute("course.updated", true);

          // Invalidate all potentially stale cache entries (by id, slug, title) via centralized keys
          await Promise.allSettled([
            this.redisService.del(CACHE_KEYS.course.byId(course.getId())),
            this.redisService.del(CACHE_KEYS.course.bySlug(course.getSlug())),
            this.redisService.del(CACHE_KEYS.course.byTitle(course.getTitle())),
            this.redisService.delByPattern(
              CACHE_KEYS.course.instructorWildcard(course.getInstructorId()),
            ),
          ]);

          this.logger.debug(
            `Successfully updated course ${course.getId()} and invalidated relevant cache.`,
            { ctx: CourseTypeOrmRepository.name },
          );
        } catch (error: any) {
          this.logger.error(`Failed to update course: ${error.message}`, {
            ctx: CourseTypeOrmRepository.name,
            error,
          });
          throw error;
        }
      },
    );
  }

  async findById(
    id: string,
    options?: CourseRelationOptions,
  ): Promise<Course | null> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findById",
      async (span) => {
        const {
          withLessons = true,
          withQuiz = true,
          withModules = true,
        } = options ?? {};
        try {
          span.setAttributes({
            "db.course.operation": "SELECT",
            "course.id": id,
          });
          this.metrics.incrementDBRequestCounter("SELECT");

          const end = this.metrics.measureDBOperationDuration(
            "course.findById",
            "SELECT",
          );

          // Build query using CourseRelationOptions for flexible eager loading
          let qb = this.repo
            .createQueryBuilder("course")
            .leftJoinAndSelect("course.instructor", "instructor")
            .where("course.id = :id", { id })
            .andWhere("course.deletedAt IS NULL");

          // Dynamically join relations based on options
          if (withModules) {
            qb = qb
              .leftJoinAndSelect(
                "course.modules",
                "modules",
                "modules.deletedAt IS NULL",
              )
              .orderBy("modules.order", "ASC");

            if (withLessons) {
              qb = qb.leftJoinAndSelect(
                "modules.lessons",
                "lessons",
                "lessons.deletedAt IS NULL",
              );
            }
            if (withQuiz) {
              qb = qb.leftJoinAndSelect(
                "modules.quiz",
                "quiz",
                "quiz.deletedAt IS NULL",
              );
            }
          }

          const ormEntity = await qb.getOne();

          end();

          if (!ormEntity) {
            span.setAttribute("course.found", false);
            this.logger.warn(`Course with id ${id} not found`, {
              ctx: CourseTypeOrmRepository.name,
            });
            return null;
          }

          span.setAttribute("course.found", true);

          this.logger.debug(`Fetched course ${id} from DB`, {
            ctx: CourseTypeOrmRepository.name,
          });
          // Consider caching here (if not in the domain-mapper already)

          return CourseEntityMapper.toDomainCourse(ormEntity);
        } catch (error: any) {
          this.logger.error(
            `Error fetching course by id ${id}: ${error.message}`,
            {
              ctx: CourseTypeOrmRepository.name,
              error,
            },
          );
          span.recordException(error);
          throw error;
        }
      },
    );
  }

  public async findByIds(ids: string[]): Promise<CourseMetadata[]> {
    if (!ids || ids.length === 0) return [];
    try {
      return await this.tracer.startActiveSpan(
        "CourseTypeOrmRepository.findByIds",
        async (span) => {
          span.setAttributes({
            "db.course.operation": "SELECT_MANY",
            "course.ids.count": ids.length,
          });

          this.logger.debug(
            `Fetching courses from database with ids: [${ids.join(", ")}]`,
            { ctx: CourseTypeOrmRepository.name },
          );

          if (!ids?.length) return [];
          const normalizedIds = [...new Set(ids)].sort();
          const cacheKey = CACHE_KEYS.course.byIds(normalizedIds);

          const cached =
            await this.redisService.get<CourseMetadata[]>(cacheKey);
          if (cached?.length) return cached;

          const qb = this.repo
            .createQueryBuilder("course")
            .leftJoin("course.instructor", "instructor")
            .leftJoin("course.modules", "modules")
            .leftJoin("modules.lessons", "lessons")
            .leftJoin("modules.quiz", "quiz")
            .where("course.id IN (:...ids)", { ids: normalizedIds })
            .andWhere("course.deletedAt IS NULL")
            .select([
              "course.id",
              "course.title",
              "course.topics",
              "course.instructorId",
              "course.subTitle",
              "course.category",
              "course.subCategory",
              "course.currency",
              "course.courseLanguage",
              "course.subtitleLanguage",
              "course.level",
              "course.duration",
              "course.durationUnit",
              "course.description",
              "course.learningOutcomes",
              "course.targetAudience",
              "course.courseRequirements",
              "course.thumbnail",
              "course.trailer",
              "course.status",
              "course.slug",
              "course.rating",
              "course.numberOfRatings",
              "course.students",
              "course.createdAt",
              "course.updatedAt",
              "course.deletedAt",
              "course.price",
              "course.discountPrice",

              "instructor.id",
              "instructor.name",
              "instructor.email",
            ])
            .addSelect("COUNT(DISTINCT modules.id)", "noOfModules")
            .addSelect("COUNT(DISTINCT lessons.id)", "noOfLessons")
            .addSelect("COUNT(DISTINCT quiz.id)", "noOfQuizzes")
            .groupBy("course.id")
            .addGroupBy("instructor.id");

          const { raw, entities } = await qb.getRawAndEntities();

          const entityMap = new Map(entities.map((e) => [e.id, e]));
          const rawMap = new Map(raw.map((r: any) => [r.course_id, r]));

          const ordered = normalizedIds
            .map((id) => {
              const entity = entityMap.get(id);
              const rawRow = rawMap.get(id);
              if (!entity || !rawRow) return null;
              return CourseEntityMapper.toCourseMetadataFromRaw(
                rawRow,
                entity.instructor,
              );
            })
            .filter(Boolean) as CourseMetadata[];

          await this.redisService.set(cacheKey, ordered, 300);
          return ordered;
        },
      );
    } catch (error) {
      this.logger.warn(`Error fetching courses with ids: [${ids.join(", ")}]`, {
        error,
        ctx: CourseTypeOrmRepository.name,
      });
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Course | null> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findBySlug",
      async (span) => {
        span.setAttributes({
          "db.course.operation": "SELECT",
          "course.slug": slug,
        });
        const cacheKey = CACHE_KEYS.course.bySlug(slug);
        const cachedCourse =
          await this.redisService.get<CourseOrmEntity>(cacheKey);

        if (cachedCourse) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for course ${slug}`, {
            ctx: CourseTypeOrmRepository.name,
          });
          return CourseEntityMapper.toDomainCourse(cachedCourse);
        }
        span.setAttribute("cache.hit", false);

        this.metrics.incrementDBRequestCounter("SELECT");
        const end = this.metrics.measureDBOperationDuration(
          "course.findBySlug",
          "SELECT",
        );
        // Exclude modules, lessons, and quizzes with is_deleted=true by using a query builder
        const ormEntity = await this.repo
          .createQueryBuilder("course")
          .leftJoinAndSelect(
            "course.modules",
            "module",
            "module.deletedAt IS NULL",
          )
          .leftJoinAndSelect(
            "module.lessons",
            "lesson",
            "lesson.deletedAt IS NULL",
          )
          .leftJoinAndSelect("module.quiz", "quiz", "quiz.deletedAt IS NULL")
          .leftJoinAndSelect("course.instructor", "instructor")
          .where("course.slug = :slug", { slug })
          .andWhere("course.deletedAt IS NULL")
          .getOne();
        end();

        if (!ormEntity) {
          span.setAttribute("course.found", false);
          return null;
        }
        span.setAttribute("course.found", true);

        await this.redisService.set(cacheKey, ormEntity, 3600); // 1 hour

        this.logger.debug(`Cached course ${slug}`, {
          ctx: CourseTypeOrmRepository.name,
        });
        return CourseEntityMapper.toDomainCourse(ormEntity);
      },
    );
  }

  async findByInstructorId(
    instructorId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "ASC" | "DESC" = "ASC",
  ): Promise<{ courses: CourseMetadata[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findByInstructorId",
      async (span) => {
        span.setAttributes({
          "db.course.operation": "SELECT",
          "course.instructor": instructorId,
          "course.page": page,
          "course.sortBy": sortBy,
          "course.sortOrder": sortOrder,
        });

        const sortColumn = this.getSortColumn(sortBy);

        const cacheKey = CACHE_KEYS.course.byInstructor(
          instructorId,
          page,
          limit,
          sortBy,
          sortOrder,
        );

        const cached = await this.redisService.get<{
          courses: CourseMetadata[];
          total: number;
        }>(cacheKey);

        if (cached) return cached;

        const baseQb = this.repo
          .createQueryBuilder("course")
          .where("course.deletedAt IS NULL")
          .andWhere("course.instructorId = :instructorId", { instructorId });

        const total = await baseQb.clone().getCount();

        const idRows = await baseQb
          .clone()
          .select("course.id", "id")
          .orderBy(sortColumn, sortOrder)
          .skip((page - 1) * limit)
          .take(limit)
          .getRawMany<{ id: string }>();

        const ids = idRows.map((r) => r.id);

        if (!ids.length) return { courses: [], total };

        const qb = this.repo
          .createQueryBuilder("course")
          .leftJoin("course.instructor", "instructor")
          .leftJoin("course.modules", "modules")
          .leftJoin("modules.lessons", "lessons")
          .leftJoin("modules.quiz", "quiz")
          .where("course.id IN (:...ids)", { ids })
          .select([
            "course.id",
            "course.title",
            "course.topics",
            "course.instructorId",
            "course.subTitle",
            "course.category",
            "course.subCategory",
            "course.currency",
            "course.courseLanguage",
            "course.subtitleLanguage",
            "course.level",
            "course.duration",
            "course.durationUnit",
            "course.description",
            "course.learningOutcomes",
            "course.targetAudience",
            "course.courseRequirements",
            "course.thumbnail",
            "course.trailer",
            "course.status",
            "course.slug",
            "course.rating",
            "course.numberOfRatings",
            "course.students",
            "course.createdAt",
            "course.updatedAt",
            "course.deletedAt",
            "course.price",
            "course.discountPrice",

            "instructor.id",
            "instructor.name",
            "instructor.email",
          ])
          .addSelect("COUNT(DISTINCT modules.id)", "noOfModules")
          .addSelect("COUNT(DISTINCT lessons.id)", "noOfLessons")
          .addSelect("COUNT(DISTINCT quiz.id)", "noOfQuizzes")
          .groupBy("course.id")
          .addGroupBy("instructor.id");

        const { raw, entities } = await qb.getRawAndEntities();

        const entityMap = new Map(entities.map((e) => [e.id, e]));
        const rawMap = new Map(raw.map((r: any) => [r.course_id, r]));

        const ordered = ids
          .map((id) => {
            const entity = entityMap.get(id);
            const rawRow = rawMap.get(id);
            if (!entity || !rawRow) return null;
            return CourseEntityMapper.toCourseMetadataFromRaw(
              rawRow,
              entity.instructor,
            );
          })
          .filter(Boolean) as CourseMetadata[];

        const result = { courses: ordered, total };
        await this.redisService.set(cacheKey, result, 120);

        return result;
      },
    );
  }

  async findAll(
    params: GetCourseParams,
  ): Promise<{ courses: CourseMetadata[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status = CourseStatus.PUBLISHED,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      category = [],
      level = [],
      minPrice,
      maxPrice,
      rating,
    } = params;

    return this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findAll.optimized",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "db.entity": "Course",
        });

        // Use centralization for cache key generation
        const normalizedParams = {
          page,
          limit,
          status,
          sortBy,
          sortOrder,
          search,
          category: category ?? [],
          level: level ?? [],
          minPrice,
          maxPrice,
          rating,
        };
        const cacheKey = CACHE_KEYS.course.list(normalizedParams);

        const cached = await this.redisService.get<{
          courses: CourseMetadata[];
          total: number;
        }>(cacheKey);

        if (cached) {
          span.setAttribute("cache.hit", true);
          return cached;
        }

        span.setAttribute("cache.hit", false);

        const normalizedSearch = search?.trim().toLowerCase() || null;
        const normalizedCategory = [...new Set(category)]
          .map((x) => x.trim())
          .sort();
        const normalizedLevel = [...new Set(level)].map((x) => x.trim()).sort();

        const sortColumn = this.getSortColumn(sortBy);

        const baseQb = this.repo
          .createQueryBuilder("course")
          .where("course.deletedAt IS NULL")
          .andWhere("course.status = :status", { status });

        // Category/topic filters
        if (normalizedCategory.length > 0) {
          baseQb.andWhere(
            new Brackets((qb1) => {
              qb1
                .where("course.category IN (:...category)", {
                  category: normalizedCategory,
                })
                .orWhere("course.subCategory IN (:...category)", {
                  category: normalizedCategory,
                })
                .orWhere("course.topics && ARRAY[:...category]", {
                  category: normalizedCategory,
                });
            }),
          );
        }

        // Level filter
        if (normalizedLevel.length > 0) {
          baseQb.andWhere("course.level IN (:...level)", {
            level: normalizedLevel,
          });
        }

        // Price filter
        if (minPrice !== undefined && minPrice !== null) {
          baseQb.andWhere("course.price >= :minPrice", { minPrice });
        }
        if (maxPrice !== undefined && maxPrice !== null) {
          baseQb.andWhere("course.price <= :maxPrice", { maxPrice });
        }

        // Rating
        if (rating !== undefined && rating !== null) {
          baseQb.andWhere("course.rating >= :rating", { rating });
        }

        // Search
        if (normalizedSearch) {
          baseQb.andWhere(
            new Brackets((qb1) => {
              qb1
                .where("LOWER(course.title) LIKE :search", {
                  search: `%${normalizedSearch}%`,
                })
                .orWhere("LOWER(course.description) LIKE :search", {
                  search: `%${normalizedSearch}%`,
                })
                .orWhere("LOWER(course.category) LIKE :search", {
                  search: `%${normalizedSearch}%`,
                })
                .orWhere("LOWER(course.subCategory) LIKE :search", {
                  search: `%${normalizedSearch}%`,
                })
                .orWhere("LOWER(course.level) LIKE :search", {
                  search: `%${normalizedSearch}%`,
                });
            }),
          );
        }

        // total count (no joins = fast)
        this.metrics.incrementDBRequestCounter("SELECT");
        const endCount = this.metrics.measureDBOperationDuration(
          "course.findAll.count",
          "SELECT",
        );
        const total = await baseQb.clone().getCount();
        endCount();

        // page ids
        const endIds = this.metrics.measureDBOperationDuration(
          "course.findAll.ids",
          "SELECT",
        );
        const idRows = await baseQb
          .clone()
          .select("course.id", "id")
          .orderBy(sortColumn, sortOrder as any)
          .skip((page - 1) * limit)
          .take(limit)
          .getRawMany<{ id: string }>();
        endIds();

        const ids = idRows.map((r) => r.id);

        if (!ids.length) {
          const empty = { courses: [], total };
          await this.redisService.set(cacheKey, empty, 60);
          return empty;
        }

        // Phase 2: fetch metadata + counts using group by
        const endData = this.metrics.measureDBOperationDuration(
          "course.findAll.data",
          "SELECT",
        );

        const qb = this.repo
          .createQueryBuilder("course")
          .leftJoin("course.instructor", "instructor")
          .leftJoin("course.modules", "modules")
          .leftJoin("modules.lessons", "lessons")
          .leftJoin("modules.quiz", "quiz")
          .where("course.id IN (:...ids)", { ids })
          .select([
            "course.id",
            "course.title",
            "course.topics",
            "course.instructorId",
            "course.subTitle",
            "course.category",
            "course.subCategory",
            "course.currency",
            "course.courseLanguage",
            "course.subtitleLanguage",
            "course.level",
            "course.duration",
            "course.durationUnit",
            "course.description",
            "course.learningOutcomes",
            "course.targetAudience",
            "course.courseRequirements",
            "course.thumbnail",
            "course.trailer",
            "course.status",
            "course.slug",
            "course.rating",
            "course.numberOfRatings",
            "course.students",
            "course.createdAt",
            "course.updatedAt",
            "course.deletedAt",
            "course.price",
            "course.discountPrice",

            "instructor.id",
            "instructor.name",
            "instructor.email",
          ])
          .addSelect("COUNT(DISTINCT modules.id)", "noOfModules")
          .addSelect("COUNT(DISTINCT lessons.id)", "noOfLessons")
          .addSelect("COUNT(DISTINCT quiz.id)", "noOfQuizzes")
          .groupBy("course.id")
          .addGroupBy("instructor.id");

        const { raw, entities } = await qb.getRawAndEntities();
        endData();

        // rebuild ordered list
        const entityMap = new Map(entities.map((e) => [e.id, e]));
        const rawMap = new Map(raw.map((r: any) => [r.course_id, r]));

        const orderedCourses: CourseMetadata[] = ids
          .map((id) => {
            const entity = entityMap.get(id);
            const rawRow = rawMap.get(id);
            if (!entity || !rawRow) return null;

            return CourseEntityMapper.toCourseMetadataFromRaw(
              rawRow,
              entity.instructor,
            );
          })
          .filter(Boolean) as CourseMetadata[];

        const result = { courses: orderedCourses, total };

        await this.redisService.set(cacheKey, result, 120);

        return result;
      },
    );
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "ASC" | "DESC" = "ASC",
  ): Promise<{ courses: Course[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.findByUserId",
      async (span) => {
        span.setAttributes({
          "db.course.operation": "SELECT",
          "course.user.id": userId,
        });
        const cacheKey = CACHE_KEYS.course.byUser(
          userId,
          page,
          limit,
          sortBy,
          sortOrder,
        );
        const cachedResult = await this.redisService.get<{
          courses: CourseOrmEntity[];
          total: number;
        }>(cacheKey);
        if (cachedResult) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for courses by user ${userId}`, {
            ctx: CourseTypeOrmRepository.name,
          });
          return {
            courses: cachedResult.courses.map((c: any) =>
              CourseEntityMapper.toDomainCourse(c),
            ),
            total: cachedResult.total,
          };
        }
        span.setAttribute("cache.hit", false);

        const end = this.metrics.measureDBOperationDuration(
          "course.findByUserId",
          "SELECT",
        );
        const queryBuilder = this.repo
          .createQueryBuilder("course")
          .innerJoin("course.enrollments", "enrollment")
          .where("course.deletedAt IS NULL")
          .andWhere("enrollment.studentId = :userId", { userId })
          .leftJoinAndSelect("course.modules", "modules")
          .leftJoinAndSelect("course.instructor", "instructor")
          .leftJoinAndSelect("modules.lessons", "lessons")
          .leftJoinAndSelect("modules.quiz", "quiz")
          .skip((page - 1) * limit)
          .take(limit)
          .orderBy(`course.${sortBy}`, sortOrder);

        const [ormEntities, total] = await queryBuilder.getManyAndCount();

        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        const courses = ormEntities.map(CourseEntityMapper.toDomainCourse);
        await this.redisService.set(
          cacheKey,
          { courses: ormEntities, total },
          3600,
        );
        this.logger.debug(`Cached courses for user ${userId}`, {
          ctx: CourseTypeOrmRepository.name,
        });
        span.setAttribute("redis.cache.course.set", true);
        return { courses, total };
      },
    );
  }

  async delete(course: Course): Promise<void> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.delete",
      async (span) => {
        course.softDelete();

        span.setAttributes({
          "db.operation": "DELETE",
          "course.id": course.getId(),
        });
        const ormEntity = CourseEntityMapper.toOrmCourse(course);

        const end = this.metrics.measureDBOperationDuration(
          "course.save",
          "DELETE",
        );
        try {
          const saved = await this.repo.save(ormEntity);
          end();
          if (!saved || !saved.id) {
            this.logger.warn(
              `Delete (soft) operation may have failed for course: ${course.getId()}`,
              { ctx: CourseTypeOrmRepository.name },
            );
          }
        } catch (err) {
          end();
          this.logger.warn(
            `Exception during soft delete for course: ${course.getId()}, error: ${err?.message}`,
            { ctx: CourseTypeOrmRepository.name, error: err },
          );
          throw err;
        }
        this.metrics.incrementDBRequestCounter("DELETE");
        span.setAttribute("course.deleted", true);

        await Promise.all([
          this.redisService.del(
            CACHE_KEYS.course.byInstructor(course.getInstructorId()),
          ),
          this.redisService.del(CACHE_KEYS.course.byId(course.getId())),
          this.redisService.del(CACHE_KEYS.course.byTitle(course.getTitle())),
          this.redisService.del(CACHE_KEYS.course.bySlug(course.getSlug())),
        ]);

        span.setAttribute(
          "cache.invalidated.keys",
          `[${CACHE_KEYS.course.byInstructor(course.getInstructorId())}, ${CACHE_KEYS.course.byId(course.getId())}, ${CACHE_KEYS.course.byTitle(course.getTitle())}]`,
        );
        this.logger.debug(`Invalidated cache for course ${course.getId()}`, {
          ctx: CourseTypeOrmRepository.name,
        });
      },
    );
  }

  /**
   * Returns the total count of courses.
   * Best practice: use count with filter for soft-delete.
   */
  async getCoursesStats(): Promise<{
    totalCourses: number;
    draftCourses: number;
    publishedCourses: number;
    unPublishedCourses: number;
  }> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.getCoursesStats",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "courses.stats": true,
        });

        try {
          this.metrics.incrementDBRequestCounter("SELECT");

          // Count all non-deleted courses (total)
          const totalCourses = await this.repo.count({
            where: { deletedAt: null },
          });

          // Count published courses
          const publishedCourses = await this.repo.count({
            where: {
              deletedAt: null,
              status: CourseStatus.PUBLISHED,
            },
          });

          // Count draft courses
          const draftCourses = await this.repo.count({
            where: {
              deletedAt: null,
              status: CourseStatus.DRAFT,
            },
          });

          // Count unpublished (created but not yet published: e.g. status = 'UNPUBLISHED')
          const unPublishedCourses = await this.repo.count({
            where: {
              deletedAt: null,
              status: CourseStatus.UNPUBLISHED,
            },
          });

          span.setAttribute("courses.total", totalCourses);
          span.setAttribute("courses.published", publishedCourses);
          span.setAttribute("courses.draft", draftCourses);
          span.setAttribute("courses.unpublished", unPublishedCourses);

          return {
            totalCourses,
            draftCourses,
            publishedCourses,
            unPublishedCourses,
          };
        } catch (err) {
          this.logger.error("Failed to fetch course stats", {
            ctx: CourseTypeOrmRepository.name,
            error: err,
          });
          throw err;
        }
      },
    );
  }

  /**
   * Returns average rating, total ratings and breakdown for a specific course/instructor.
   * Assumes ratings are stored in CourseOrmEntity fields.
   */
  async getInstructorCourseRatingStats(
    instructorId: string,
    courseId: string,
  ): Promise<{
    averageRating: number;
    totalRatings: number;
    breakdown: string;
  }> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.getInstructorCourseRatingStats",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "course.id": courseId,
          "instructor.id": instructorId,
        });
        try {
          this.metrics.incrementDBRequestCounter("SELECT");

          // You may need to adapt breakdown for your use-case.
          // Here, it's just a placeholder for the rating distribution.
          const course = await this.repo.findOne({
            where: {
              id: courseId,
              instructorId: instructorId,
              deletedAt: null,
            },
            select: [
              "rating", // averageRating
              "numberOfRatings", // totalRatings
              // Add a `ratingBreakdown`/whatever field if you track it
            ],
          });
          if (!course) {
            span.setAttribute("course.rating.found", false);
            return { averageRating: 0, totalRatings: 0, breakdown: "" };
          }
          span.setAttribute("course.rating.found", true);

          // For real breakdown, you'd need to aggregate e.g. via ratings table.
          // Here, return as stringified object if available.
          let breakdown = "";
          // If you add a `ratingBreakdown` property to your entity, adapt this module.
          // breakdown = (course as any).ratingBreakdown ?
          //   JSON.stringify((course as any).ratingBreakdown) : "";

          return {
            averageRating: course.rating ?? 0,
            totalRatings: course.numberOfRatings ?? 0,
            breakdown,
          };
        } catch (err) {
          this.logger.error(
            "Failed to fetch instructor's course rating stats",
            {
              ctx: CourseTypeOrmRepository.name,
              error: err,
            },
          );
          throw err;
        }
      },
    );
  }

  /**
   * Returns stats for an instructor's courses: total/published/draft.
   */
  async getInstructorCoursesStats(
    instructorId: string,
  ): Promise<InstructorCoursesStats> {
    return await this.tracer.startActiveSpan(
      "CourseTypeOrmRepository.getInstructorCoursesStats",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "instructor.id": instructorId,
        });

        const end = this.metrics.measureDBOperationDuration(
          "course.getInstructorCoursesStats",
          "SELECT",
        );

        try {
          this.metrics.incrementDBRequestCounter("SELECT");

          // Get course-based stats using property names
          const courseStats = await this.repo
            .createQueryBuilder("course")
            .where("course.instructorId = :instructorId", { instructorId })
            .select([
              "COUNT(course.id) as total",
              "SUM(CASE WHEN course.status = 'published' THEN 1 ELSE 0 END) as published",
              "SUM(CASE WHEN course.status = 'draft' THEN 1 ELSE 0 END) as draft",
              "SUM(COALESCE(course.numberOfRatings, 0)) as total_ratings",
              "AVG(COALESCE(course.rating, 0)) as average_rating",
              "SUM(COALESCE(course.duration, 0)) as total_duration",
            ])
            .getRawOne();

          end();

          const totalCourses = Number(courseStats?.total || 0);
          const publishedCourses = Number(courseStats?.published || 0);
          const draftCourses = Number(courseStats?.draft || 0);
          const totalRatings = Number(courseStats?.total_ratings || 0);
          const averageRating = Number(courseStats?.average_rating || 0);
          const totalHoursTaught = Number(courseStats?.total_duration || 0);

          span.setAttributes({
            "courses.instructor.total": totalCourses,
            "courses.instructor.published": publishedCourses,
            "courses.instructor.draft": draftCourses,
          });

          return {
            totalCourses,
            publishedCourses,
            draftCourses,
            totalRatings,
            averageRating,
            totalHoursTaught,
          };
        } catch (err) {
          end();
          this.logger.error("Failed to fetch instructor's courses stats", {
            ctx: CourseTypeOrmRepository.name,
            error: err,
          });
          throw err;
        }
      },
    );
  }

  async updateLessonCount(courseId: string, count: number): Promise<void> {
    try {
      const result = await this.repo.update(
        { id: courseId },
        { totalLessonsCount: count },
      );
      if (!result || result.affected === undefined) {
        this.logger.warn(
          `UpdateLessonCount: update result malformed for course ${courseId}`,
          { ctx: CourseTypeOrmRepository.name, result },
        );
      } else if (result.affected === 0) {
        this.logger.warn(
          `UpdateLessonCount: no rows affected for course ${courseId}, likely does not exist`,
          { ctx: CourseTypeOrmRepository.name },
        );
      }
    } catch (err) {
      this.logger.warn(
        `Exception during updateLessonCount for course: ${courseId}, error: ${err?.message}`,
        { ctx: CourseTypeOrmRepository.name, error: err },
      );
      throw err;
    }
    await this.redisService.del(CACHE_KEYS.course.byId(courseId));
  }

  /**
   * Utility to safely get DB sort column from config/params.
   */
  private getSortColumn(sortBy?: string): string {
    const map: Record<string, string> = {
      createdAt: "course.createdAt",
      updatedAt: "course.updatedAt",
      price: "course.price",
      rating: "course.rating",
      students: "course.students",
      title: "course.title",
    };

    return map[sortBy || "createdAt"] ?? map.createdAt;
  }
}
