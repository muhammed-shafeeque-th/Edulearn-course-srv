import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizOrmEntity } from "../entities/quiz.orm-entity";
import { IQuizRepository } from "../../../domain/repositories/quiz.repository";
import { Quiz } from "../../../domain/entities/quiz.entity";
import { IMetricService } from "src/application/adaptors/metric.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { QuizEntityMapper } from "../mappers/quiz.entity.mapper";
import { ICacheService } from "src/application/adaptors/cache-service";
import { CACHE_KEYS } from "@/infrastructure/redis/cache-keys";
import { BaseRepository } from "./base.repository";

@Injectable()
export class QuizTypeOrmRepository
  extends BaseRepository<Quiz, QuizOrmEntity>
  implements IQuizRepository
{
  protected contextName: string = QuizTypeOrmRepository.name;
  constructor(
    @InjectRepository(QuizOrmEntity)
    repo: Repository<QuizOrmEntity>,
    cache: ICacheService,
    logger: ILoggerService,
    tracer: ITraceService,
    metrics: IMetricService,
  ) {
    super(repo, logger, tracer, metrics, cache);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Quiz | null> {
    return await this.execute("findByIdempotencyKey", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "quiz.idempotencyKey": idempotencyKey,
      });

      this.metrics.incrementDBRequestCounter("SELECT");
      const end = this.metrics.measureDBOperationDuration(
        "quiz.findByIdempotencyKey",
        "SELECT",
      );

      const ormQuiz = await this.repo.findOne({
        where: { idempotencyKey, deletedAt: null },
      });

      end();

      if (!ormQuiz) {
        this.logger.debug(
          `No quiz found for idempotencyKey: ${idempotencyKey}`,
          { ctx: QuizTypeOrmRepository.name },
        );
        return null;
      }

      return QuizEntityMapper.toDomainQuiz(ormQuiz);
    });
  }

  async save(quiz: Quiz): Promise<void> {
    return await this.execute("save", async (span) => {
      span.setAttributes({
        "db.operation": "INSERT",
        "quiz.title": quiz.getTitle(),
      });

      // Ensure module doesn't already have a quiz (Enforcement of 'one quiz per module')
      const existingQuiz = await this.repo.findOne({
        where: { moduleId: quiz.getModuleId(), deletedAt: null },
      });
      if (existingQuiz && existingQuiz.id !== quiz.getId()) {
        this.logger.warn(
          `Attempt to save multiple quizzes for module ${quiz.getModuleId()}`,
          {
            ctx: QuizTypeOrmRepository.name,
          },
        );
        throw new Error("A module can have at most one quiz.");
      }

      const ormEntity = QuizEntityMapper.toOrmQuiz(quiz);

      this.metrics.incrementDBRequestCounter("INSERT");
      const end = this.metrics.measureDBOperationDuration(
        "quiz.save",
        "INSERT",
      );
      let result: QuizOrmEntity | undefined;
      try {
        result = await this.repo.save(ormEntity);
      } catch (err) {
        this.logger.warn(`Error saving quiz "${quiz.getId()}": ${err}`, {
          ctx: QuizTypeOrmRepository.name,
        });
        end();
        throw err;
      }
      end();

      if (!result) {
        this.logger.warn(
          `Save operation returned null or undefined for quiz ${quiz.getId()}`,
          { ctx: QuizTypeOrmRepository.name },
        );
      }

      const cacheKeys = CACHE_KEYS.quiz.invalidateKeys(
        quiz.getId(),
        quiz.getModuleId(),
        quiz.getCourseId(),
      );
      await Promise.all(cacheKeys.map((k) => this.cache.del(k)));

      span.setAttributes({
        "invalidated.cache.keys": `[${cacheKeys.join(", ")}]`,
      });
      this.logger.debug(`Invalidated cache for quiz ${quiz.getId()}`, {
        ctx: QuizTypeOrmRepository.name,
      });
    });
  }

  async findById(id: string): Promise<Quiz | null> {
    return await this.execute("findById", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "quiz.id": id,
      });
      const cacheKey = CACHE_KEYS.quiz.byId(id);
      const cachedQuiz = await this.cache.get<QuizOrmEntity | null>(cacheKey);
      if (cachedQuiz) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for quiz ${id}`, {
          ctx: QuizTypeOrmRepository.name,
        });
        return QuizEntityMapper.toDomainQuiz(cachedQuiz);
      }
      span.setAttribute("cache.hit", false);

      this.metrics.incrementDBRequestCounter("SELECT");
      const end = this.metrics.measureDBOperationDuration(
        "quiz.findById",
        "SELECT",
      );
      const ormEntity = await this.repo.findOne({
        where: { id, deletedAt: null },
      });
      end();

      if (!ormEntity) {
        span.setAttribute("quiz.found", false);
        return null;
      }
      span.setAttribute("quiz.found", true);

      const quiz = QuizEntityMapper.toDomainQuiz(ormEntity);

      await this.cache.set(cacheKey, ormEntity, 3600);
      span.setAttribute("cache.set", true);
      this.logger.debug(`Cached quiz ${id}`, {
        ctx: QuizTypeOrmRepository.name,
      });
      return quiz;
    });
  }

  /**
   * Finds the quiz for a given module.
   * A module can have at most one quiz, so return a single Quiz or null.
   */
  async findByModuleId(moduleId: string): Promise<Quiz | null> {
    return await this.execute("findByModuleId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "module.id": moduleId,
      });
      const cacheKey = CACHE_KEYS.quiz.byModule(moduleId);
      const cachedQuiz = await this.cache.get<QuizOrmEntity>(cacheKey);
      if (cachedQuiz) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for quiz for module ${moduleId}`, {
          ctx: QuizTypeOrmRepository.name,
        });
        return QuizEntityMapper.toDomainQuiz(cachedQuiz);
      }

      this.metrics.incrementDBRequestCounter("SELECT");
      const end = this.metrics.measureDBOperationDuration(
        "quiz.findByModuleId",
        "SELECT",
      );
      const ormQuiz = await this.repo.findOne({
        where: { moduleId, deletedAt: null },
      });
      end();

      if (!ormQuiz) {
        span.setAttribute("quiz.found", false);
        return null;
      }

      span.setAttribute("quiz.found", true);
      const quiz = QuizEntityMapper.toDomainQuiz(ormQuiz);
      await this.cache.set(cacheKey, ormQuiz, 3600);
      span.setAttribute("cache.set", true);
      this.logger.debug(`Cached quiz for module ${moduleId}`, {
        ctx: QuizTypeOrmRepository.name,
      });
      return quiz;
    });
  }

  async findByCourseId(courseId: string): Promise<Quiz[]> {
    return await this.execute("findByCourseId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "course.id": courseId,
      });
      const cacheKey = CACHE_KEYS.quiz.byCourse(courseId);
      const cachedQuizzes = await this.cache.get<QuizOrmEntity[] | null>(
        cacheKey,
      );
      let ormEntities: QuizOrmEntity[];

      if (cachedQuizzes) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for quizzes of course ${courseId}`, {
          ctx: QuizTypeOrmRepository.name,
        });
        ormEntities = cachedQuizzes;
      } else {
        this.metrics.incrementDBRequestCounter("SELECT");
        const end = this.metrics.measureDBOperationDuration(
          "quiz.findByCourseId",
          "SELECT",
        );
        ormEntities = await this.repo.find({
          where: { courseId, deletedAt: null },
        });
        end();

        await this.cache.set(cacheKey, ormEntities, 3600);
        span.setAttribute("cache.set", true);
        this.logger.debug(`Cached quizzes for course ${courseId}`, {
          ctx: QuizTypeOrmRepository.name,
        });
      }

      const quizzes = ormEntities.map(QuizEntityMapper.toDomainQuiz);
      span.setAttribute("db.quiz.count", quizzes.length);
      return quizzes;
    });
  }

  async delete(quiz: Quiz): Promise<void> {
    return await this.execute("delete", async (span) => {
      quiz.softDelete();
      span.setAttributes({
        "db.operation": "DELETE",
        "quiz.title": quiz.getTitle(),
      });

      this.metrics.incrementDBRequestCounter("DELETE");
      const end = this.metrics.measureDBOperationDuration(
        "quiz.save",
        "DELETE",
      );
      let result;
      try {
        // Use the primary ID to delete the quiz entity
        result = await this.repo.delete(quiz.getId());
      } catch (err) {
        this.logger.warn(
          `Error deleting (soft) quiz "${quiz.getId()}": ${err}`,
          { ctx: QuizTypeOrmRepository.name },
        );
        end();
        throw err;
      }
      end();

      if (!result) {
        this.logger.warn(
          `Delete operation (save for softDelete) returned null or undefined for quiz ${quiz.getId()}`,
          { ctx: QuizTypeOrmRepository.name },
        );
      }

      const cacheKeys = CACHE_KEYS.quiz.invalidateKeys(
        quiz.getId(),
        quiz.getModuleId(),
        quiz.getCourseId(),
      );
      await Promise.all(cacheKeys.map((k) => this.cache.del(k)));

      span.setAttributes({
        "invalidated.cache.keys": `[${cacheKeys.join(", ")}]`,
      });
      this.logger.debug(`Invalidated cache for quiz ${quiz.getId()}`, {
        ctx: QuizTypeOrmRepository.name,
      });
    });
  }
}
