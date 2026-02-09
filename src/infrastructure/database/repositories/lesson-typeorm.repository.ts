import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonOrmEntity } from "../entities/lesson.orm-entity";
import { ILessonRepository } from "../../../domain/repositories/lesson.repository";
import { Lesson } from "../../../domain/entities/lesson.entity";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { LessonEntityMapper } from "../mappers/lesson.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";

@Injectable()
export class LessonTypeOrmRepository implements ILessonRepository {
  constructor(
    @InjectRepository(LessonOrmEntity)
    private readonly repo: Repository<LessonOrmEntity>,
    private readonly redisService: ICacheService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService
  ) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<Lesson | null> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.findByIdempotencyKey",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "lesson.idempotencyKey": idempotencyKey,
        });

        this.metrics.incrementDBRequestCounter("SELECT");
        const end = this.metrics.measureDBOperationDuration(
          "lesson.findByIdempotencyKey",
          "SELECT"
        );

        // Try to find lesson by idempotencyKey
        const ormLesson = await this.repo.findOne({
          where: { idempotencyKey },
        });

        end();

        if (!ormLesson) {
          this.logger.debug(
            `No lesson found for idempotencyKey: ${idempotencyKey}`,
            { ctx: LessonTypeOrmRepository.name }
          );
          return null;
        }

        // Map LessonOrmEntity to Lesson domain entity
        const lesson = LessonEntityMapper.toDomainLesson(ormLesson);

        return lesson;
      }
    );
  }

  async save(lesson: Lesson): Promise<void> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.save",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "lesson.id": lesson.getId(),
          "lesson.title": lesson.getTitle(),
        });
        const ormEntity = LessonEntityMapper.toOrmLesson(lesson);

        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "lesson.save",
          "INSERT"
        );
        let result: LessonOrmEntity | undefined;
        try {
          result = await this.repo.save(ormEntity);
        } catch (err) {
          this.logger.warn(
            `Error while saving lesson ${lesson.getId()}: ${err}`,
            { ctx: LessonTypeOrmRepository.name }
          );
          throw err;
        }
        end();
        this.metrics.incrementDBRequestCounter("INSERT");

        if (!result) {
          this.logger.warn(
            `Write operation returned null/undefined (save) for lesson ${lesson.getId()}`,
            { ctx: LessonTypeOrmRepository.name }
          );
        } else {
          span.setAttribute("db.saved", true);
        }

        await Promise.all([
          this.redisService.del(CACHE_KEYS.lesson.byId(lesson.getId())),
          this.redisService.del(CACHE_KEYS.lesson.bySection(lesson.getSectionId())),
        ]);

        span.setAttribute(
          "cache.invalidated.keys",
          `[${CACHE_KEYS.lesson.byId(lesson.getId())}, ${CACHE_KEYS.lesson.bySection(lesson.getSectionId())}]`
        );
        this.logger.debug(`Invalidated cache for lesson ${lesson.getId()}`, {
          ctx: LessonTypeOrmRepository.name,
        });
      }
    );
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.findByCourseId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "course.id": courseId,
        });

        // Attempt to retrieve from cache first (optional, for performance)
        const cacheKey = CACHE_KEYS.lesson.byCourse(courseId);
        const cachedLessons =
          await this.redisService.get<LessonOrmEntity[]>(cacheKey);
        if (cachedLessons) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for lessons in course ${courseId}`, {
            ctx: LessonTypeOrmRepository.name,
          });
          return cachedLessons
            .map((orm: any) => LessonEntityMapper.toDomainLesson(orm))
            .filter((l) => l != null);
        }
        span.setAttribute("cache.hit", false);

        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "lesson.findByCourseId",
          "SELECT"
        );

        // Query for lessons related to the course, filtering out deleted lessons
        const ormLessons = await this.repo.find({
          where: {
            deletedAt: null,
            section: { courseId },
          },
          relations: ["section"],
          order: {
            order: "ASC",
          },
        });

        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        const lessons = ormLessons
          .map((orm) => LessonEntityMapper.toDomainLesson(orm))
          .filter((l) => l != null);

        // Optionally cache the result, with expiration (e.g., 1 hour)
        await this.redisService.set(cacheKey, ormLessons, 3600);

        span.setAttribute("db.lessons.found.count", lessons.length);
        this.logger.debug(
          `Found ${lessons.length} lessons for course ${courseId}`,
          { ctx: LessonTypeOrmRepository.name }
        );
        return lessons;
      }
    );
  }

  async countByCourseId(courseId: string): Promise<number> {
    // This is a read operation, not a write, so nothing to change here.
    return this.repo.count({
      where: {
        deletedAt: null,
        section: { courseId },
      },
      relations: ["section"],
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.findById",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "lesson.id": id,
        });
        const cacheKey = CACHE_KEYS.lesson.byId(id);
        const cachedLesson =
          await this.redisService.get<LessonOrmEntity>(cacheKey);
        if (cachedLesson) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for lesson ${id}`, {
            ctx: LessonTypeOrmRepository.name,
          });
          return LessonEntityMapper.toDomainLesson(cachedLesson);
        }
        span.setAttribute("cache.hit", false);

        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "lesson.findById",
          "INSERT"
        );
        const ormEntity = await this.repo.findOne({
          where: { id, deletedAt: null },
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        if (!ormEntity) {
          span.setAttribute("db.lesson.found", false);
          return null;
        }
        span.setAttribute("db.lesson.found", true);

        const lesson = LessonEntityMapper.toDomainLesson(ormEntity);
        await this.redisService.set(cacheKey, ormEntity, 3600);
        span.setAttribute("cache.set", true);
        this.logger.debug(`Cached lesson ${id}`, {
          ctx: LessonTypeOrmRepository.name,
        });
        return lesson;
      }
    );
  }

  async findBySectionId(sectionId: string): Promise<Lesson[]> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.findBySectionId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "section.id": sectionId,
        });
        const cacheKey = CACHE_KEYS.lesson.bySection(sectionId);
        const cachedLessons =
          await this.redisService.get<LessonOrmEntity[]>(cacheKey);
        if (cachedLessons) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for lessons of section ${sectionId}`, {
            ctx: LessonTypeOrmRepository.name,
          });
          return cachedLessons.map(LessonEntityMapper.toDomainLesson);
        }
        span.setAttribute("cache.hit", false);

        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "lesson.findBySectionId",
          "INSERT"
        );
        const ormEntities = await this.repo.find({
          where: { sectionId, deletedAt: null },
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        span.setAttribute("db.lessons.count", ormEntities.length);
        const lessons = ormEntities.map(LessonEntityMapper.toDomainLesson);

        await this.redisService.set(cacheKey, ormEntities, 3600);
        span.setAttribute("cache.set", true);
        this.logger.debug(`Cached lessons for section ${sectionId}`, {
          ctx: LessonTypeOrmRepository.name,
        });
        return lessons;
      }
    );
  }

  async delete(lesson: Lesson): Promise<void> {
    return await this.tracer.startActiveSpan(
      "LessonTypeOrmRepository.delete",
      async (span) => {
        lesson.softDelete();
        span.setAttributes({
          "db.operation": "DELETE",
          "lesson.id": lesson.getId(),
          "lesson.title": lesson.getTitle(),
        });
        // const ormEntity = LessonEntityMapper.toOrmLesson(lesson);

        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "lesson.delete",
          "DELETE"
        );
        let result;
        try {
          result = await this.repo.delete(lesson.getId());
        } catch (err) {
          this.logger.warn(
            `Error while soft-deleting lesson ${lesson.getId()}: ${err}`,
            { ctx: LessonTypeOrmRepository.name }
          );
          throw err;
        }
        end();
        this.metrics.incrementDBRequestCounter("DELETE");
        if (!result) {
          this.logger.warn(
            `Delete operation (save for softDelete) returned null or undefined for lesson ${lesson.getId()}`,
            { ctx: LessonTypeOrmRepository.name }
          );
        } else {
          span.setAttribute("lesson.deleted", true);
        }

        await Promise.all([
          this.redisService.del(CACHE_KEYS.lesson.byId(lesson.getId())),
          this.redisService.del(CACHE_KEYS.lesson.bySection(lesson.getSectionId())),
        ]);

        span.setAttribute(
          "cache.invalidated.keys",
          `[${CACHE_KEYS.lesson.byId(lesson.getId())}, ${CACHE_KEYS.lesson.bySection(lesson.getSectionId())}]`
        );
        this.logger.debug(`Invalidated cache for lesson ${lesson.getId()}`, {
          ctx: LessonTypeOrmRepository.name,
        });
      }
    );
  }
}
