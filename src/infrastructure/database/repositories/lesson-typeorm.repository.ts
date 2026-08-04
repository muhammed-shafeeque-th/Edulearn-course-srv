import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonOrmEntity } from "../entities/lesson.orm-entity";
import { ILessonRepository } from "../../../domain/repositories/lesson.repository";
import { Lesson } from "../../../domain/entities/lesson.entity";

import { LessonEntityMapper } from "../mappers/lesson.entity.mapper";
import { ICacheService } from "src/application/adaptors/cache-service";
import { CACHE_KEYS } from "@/infrastructure/redis/cache-keys";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IMetricService } from "src/application/adaptors/metric.service";
import { BaseRepository } from "./base.repository";

@Injectable()
export class LessonTypeOrmRepository
  extends BaseRepository<Lesson, LessonOrmEntity>
  implements ILessonRepository
{
  protected contextName: string = LessonTypeOrmRepository.name;
  constructor(
    @InjectRepository(LessonOrmEntity)
    repo: Repository<LessonOrmEntity>,
    cache: ICacheService,
    logger: ILoggerService,
    tracer: ITraceService,
    metrics: IMetricService,
  ) {
    super(repo, logger, tracer, metrics, cache);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Lesson | null> {
    return await this.execute("findByIdempotencyKey", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "lesson.idempotencyKey": idempotencyKey,
      });

      // Try to find lesson by idempotencyKey
      const ormLesson = await this.repo.findOne({
        where: { idempotencyKey },
      });

      if (!ormLesson) {
        this.logger.debug(
          `No lesson found for idempotencyKey: ${idempotencyKey}`,
          { ctx: LessonTypeOrmRepository.name },
        );
        return null;
      }

      // Map LessonOrmEntity to Lesson domain entity
      const lesson = LessonEntityMapper.toDomainLesson(ormLesson);

      return lesson;
    });
  }

  async save(lesson: Lesson): Promise<void> {
    return await this.execute("save", async (span) => {
      span.setAttributes({
        "db.operation": "INSERT",
        "lesson.id": lesson.getId(),
        "lesson.title": lesson.getTitle(),
      });
      const ormEntity = LessonEntityMapper.toOrmLesson(lesson);

      let result: LessonOrmEntity | undefined;
      try {
        result = await this.repo.save(ormEntity);
      } catch (err) {
        this.logger.warn(
          `Error while saving lesson ${lesson.getId()}: ${err}`,
          { ctx: LessonTypeOrmRepository.name },
        );
        throw err;
      }

      if (!result) {
        this.logger.warn(
          `Write operation returned null/undefined (save) for lesson ${lesson.getId()}`,
          { ctx: LessonTypeOrmRepository.name },
        );
      } else {
        span.setAttribute("db.saved", true);
      }

      await Promise.all([
        this.cache.del(CACHE_KEYS.lesson.byId(lesson.getId())),
        this.cache.del(CACHE_KEYS.lesson.byModule(lesson.getModuleId())),
      ]);

      span.setAttribute(
        "cache.invalidated.keys",
        `[${CACHE_KEYS.lesson.byId(lesson.getId())}, ${CACHE_KEYS.lesson.byModule(lesson.getModuleId())}]`,
      );
      this.logger.debug(`Invalidated cache for lesson ${lesson.getId()}`, {
        ctx: LessonTypeOrmRepository.name,
      });
    });
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    return await this.execute("findByCourseId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "course.id": courseId,
      });

      // Attempt to retrieve from cache first (optional, for performance)
      const cacheKey = CACHE_KEYS.lesson.byCourse(courseId);
      const cachedLessons = await this.cache.get<LessonOrmEntity[]>(cacheKey);
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
        "SELECT",
      );

      // Query for lessons related to the course, filtering out deleted lessons
      const ormLessons = await this.repo.find({
        where: {
          deletedAt: null,
          module: { courseId },
        },
        relations: ["module"],
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
      await this.cache.set(cacheKey, ormLessons, 3600);

      span.setAttribute("db.lessons.found.count", lessons.length);
      this.logger.debug(
        `Found ${lessons.length} lessons for course ${courseId}`,
        { ctx: LessonTypeOrmRepository.name },
      );
      return lessons;
    });
  }

  async countByCourseId(courseId: string): Promise<number> {
    // This is a read operation, not a write, so nothing to change here.
    return this.repo.count({
      where: {
        deletedAt: null,
        module: { courseId },
      },
      relations: ["module"],
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return await this.execute("findById", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "lesson.id": id,
      });
      const cacheKey = CACHE_KEYS.lesson.byId(id);
      const cachedLesson = await this.cache.get<LessonOrmEntity>(cacheKey);
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
        "INSERT",
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
      await this.cache.set(cacheKey, ormEntity, 3600);
      span.setAttribute("cache.set", true);
      this.logger.debug(`Cached lesson ${id}`, {
        ctx: LessonTypeOrmRepository.name,
      });
      return lesson;
    });
  }

  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    return await this.execute("findByModuleId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "module.id": moduleId,
      });
      const cacheKey = CACHE_KEYS.lesson.byModule(moduleId);
      const cachedLessons = await this.cache.get<LessonOrmEntity[]>(cacheKey);
      if (cachedLessons) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for lessons of module ${moduleId}`, {
          ctx: LessonTypeOrmRepository.name,
        });
        return cachedLessons.map(LessonEntityMapper.toDomainLesson);
      }
      span.setAttribute("cache.hit", false);

      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "lesson.findByModuleId",
        "INSERT",
      );
      const ormEntities = await this.repo.find({
        where: { moduleId, deletedAt: null },
      });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      span.setAttribute("db.lessons.count", ormEntities.length);
      const lessons = ormEntities.map(LessonEntityMapper.toDomainLesson);

      await this.cache.set(cacheKey, ormEntities, 3600);
      span.setAttribute("cache.set", true);
      this.logger.debug(`Cached lessons for module ${moduleId}`, {
        ctx: LessonTypeOrmRepository.name,
      });
      return lessons;
    });
  }

  async delete(lesson: Lesson): Promise<void> {
    return await this.execute("delete", async (span) => {
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
        "DELETE",
      );
      let result;
      try {
        result = await this.repo.delete(lesson.getId());
      } catch (err) {
        this.logger.warn(
          `Error while soft-deleting lesson ${lesson.getId()}: ${err}`,
          { ctx: LessonTypeOrmRepository.name },
        );
        throw err;
      }
      end();
      this.metrics.incrementDBRequestCounter("DELETE");
      if (!result) {
        this.logger.warn(
          `Delete operation (save for softDelete) returned null or undefined for lesson ${lesson.getId()}`,
          { ctx: LessonTypeOrmRepository.name },
        );
      } else {
        span.setAttribute("lesson.deleted", true);
      }

      await Promise.all([
        this.cache.del(CACHE_KEYS.lesson.byId(lesson.getId())),
        this.cache.del(CACHE_KEYS.lesson.byModule(lesson.getModuleId())),
      ]);

      span.setAttribute(
        "cache.invalidated.keys",
        `[${CACHE_KEYS.lesson.byId(lesson.getId())}, ${CACHE_KEYS.lesson.byModule(lesson.getModuleId())}]`,
      );
      this.logger.debug(`Invalidated cache for lesson ${lesson.getId()}`, {
        ctx: LessonTypeOrmRepository.name,
      });
    });
  }
}
