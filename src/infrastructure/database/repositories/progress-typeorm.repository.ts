import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";
import { IProgressRepository } from "../../../domain/repositories/progress.repository";
import { Progress } from "../../../domain/entities/progress.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { ProgressEntityMapper } from "../mappers/progress.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";


@Injectable()
export class ProgressTypeOrmRepository implements IProgressRepository {
  constructor(
    @InjectRepository(ProgressOrmEntity)
    private readonly repo: Repository<ProgressOrmEntity>,
    // private readonly redisService: ICacheService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService
  ) {}

  async save(progress: Progress): Promise<void> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.save",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "INSERT",
            "progress.id": progress.getId(),
            "progress.enrollment.id": progress.getEnrollmentId(),
          });

          const ormEntity = ProgressEntityMapper.toOrmProgress(progress);

          const end = this.metrics.measureDBOperationDuration(
            "progress.save",
            "INSERT"
          );
          const result = await this.repo.save(ormEntity);
          end();
          this.metrics.incrementDBRequestCounter("INSERT");
          span.setAttribute("db.saved", true);

          if (!result) {
            this.logger.warn(
              `Save operation returned null or undefined for progress ${progress.getId()}`,
              { ctx: ProgressTypeOrmRepository.name }
            );
          }

          // await Promise.all([
          //   this.redisService.del(CACHE_KEYS.progress.progress(progress.getId())),
          //   this.redisService.del(
          //     CACHE_KEYS.progress.enrollment(progress.getEnrollmentId())
          //   ),
          // ]);
          const invalidated = CACHE_KEYS.progress.byInvalidateOnProgressChange(progress.getId(), progress.getEnrollmentId());
          span.setAttribute(
            "cache.invalidated.keys",
            JSON.stringify(invalidated)
          );
          this.logger.debug(
            `Invalidated cache for progress ${progress.getId()}`,
            { ctx: ProgressTypeOrmRepository.name }
          );
        } catch (error) {
          this.logger.error(
            `Failed to save progress: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }

  async findByEnrollmentIdAndQuizId(
    enrollmentId: string,
    quizId: string
  ): Promise<Progress | null> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.findByEnrollmentIdAndQuizId",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "SELECT",
            "enrollment.id": enrollmentId,
            "quiz.id": quizId,
          });
          const cacheKey = CACHE_KEYS.progress.byEnrollmentQuiz(enrollmentId, quizId);
          // const cachedProgress = await this.redisService.get<ProgressOrmEntity>(cacheKey);

          // if (cachedProgress) {
          //   span.setAttribute("cache.hit", true);
          //   this.logger.debug(
          //     `Cache hit for progress of enrollment ${enrollmentId} and quiz ${quizId}`,
          //     { ctx: ProgressTypeOrmRepository.name },
          //   );
          //   return ProgressEntityMapper.toDomainProgress(cachedProgress);
          // }
          span.setAttribute("cache.hit", false);

          const end = this.metrics.measureDBOperationDuration(
            "progress.findByEnrollmentIdAndQuizId",
            "SELECT"
          );
          const orm = await this.repo.findOne({
            where: { enrollmentId, quizId, deletedAt: null },
          });
          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          if (!orm) {
            span.setAttribute("db.found", false);
            return null;
          }
          span.setAttribute("db.found", true);

          // await this.redisService.set(cacheKey, orm, 3600);
          span.setAttribute("cache.set", true);
          this.logger.debug(
            `Cached progress for enrollment ${enrollmentId} and quiz ${quizId}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          return ProgressEntityMapper.toDomainProgress(orm);
        } catch (error) {
          this.logger.error(
            `Failed to find progress by enrollment and quiz: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }

  async findById(id: string): Promise<Progress | null> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.findById",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "SELECT",
            "progress.id": id,
          });

          // const cacheKey = CACHE_KEYS.progress.progress(id);
          // const cachedProgress = await this.redisService.get<ProgressOrmEntity>(cacheKey);
          // if (cachedProgress) {
          //   span.setAttribute("cache.hit", true);
          //   this.logger.debug(`Cache hit for progress ${id}`, {
          //     ctx: ProgressTypeOrmRepository.name,
          //   });
          //   return ProgressEntityMapper.toDomainProgress(cachedProgress);
          // }
          span.setAttribute("cache.hit", false);

          const end = this.metrics.measureDBOperationDuration(
            "progress.findById",
            "SELECT"
          );
          const ormEntity = await this.repo.findOne({
            where: { id, deletedAt: null },
          });
          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          if (!ormEntity) {
            span.setAttribute("db.found", false);
            return null;
          }
          span.setAttribute("db.found", true);

          // await this.redisService.set(cacheKey, ormEntity, 3600);
          this.logger.debug(`Cached progress ${id}`, {
            ctx: ProgressTypeOrmRepository.name,
          });
          span.setAttribute("cache.set", true);
          return ProgressEntityMapper.toDomainProgress(ormEntity);
        } catch (error) {
          this.logger.error(
            `Failed to find progress by id: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Progress[]> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.findByEnrollmentId",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "SELECT",
            "enrollment.id": enrollmentId,
          });

          // const cacheKey = CACHE_KEYS.progress.enrollment(enrollmentId);
          // const cachedProgress = await this.redisService.get<ProgressOrmEntity[]>(cacheKey);
          // if (cachedProgress) {
          //   span.setAttribute("cache.hit", true);
          //   this.logger.debug(
          //     `Cache hit for progress of enrollment ${enrollmentId}`,
          //     { ctx: ProgressTypeOrmRepository.name }
          //   );
          //   return cachedProgress.map(ProgressEntityMapper.toDomainProgress);
          // }
          span.setAttribute("cache.hit", false);

          const end = this.metrics.measureDBOperationDuration(
            "progress.findByEnrollmentId",
            "SELECT"
          );
          const ormEntities = await this.repo.find({
            where: { enrollmentId, deletedAt: null },
          });
          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          const progressEntries = ormEntities.map(ProgressEntityMapper.toDomainProgress);
          // await this.redisService.set(cacheKey, ormEntities, 3600);

          span.setAttribute("enrollment.progress.count", progressEntries.length);
          this.logger.debug(`Cached progress for enrollment ${enrollmentId}`, {
            ctx: ProgressTypeOrmRepository.name,
          });
          return progressEntries;
        } catch (error) {
          this.logger.error(
            `Failed to find progress by enrollment id: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }

  async findByEnrollmentIdAndLessonId(
    enrollmentId: string,
    lessonId: string
  ): Promise<Progress | null> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.findByEnrollmentIdAndLessonId",
      async (span) => {
        try {
          span.setAttributes({
            "db.operation": "SELECT",
            "enrollment.id": enrollmentId,
            "lesson.id": lessonId,
          });

          // const cacheKey = CACHE_KEYS.progress.enrollmentLesson(enrollmentId, lessonId);
          // const cachedProgress = await this.redisService.get<ProgressOrmEntity>(cacheKey);

          // if (cachedProgress) {
          //   span.setAttribute("cache.hit", true);
          //   this.logger.debug(
          //     `Cache hit for progress of enrollment ${enrollmentId} and lesson ${lessonId}`,
          //     { ctx: ProgressTypeOrmRepository.name }
          //   );
          //   return ProgressEntityMapper.toDomainProgress(cachedProgress);
          // }
          span.setAttribute("cache.hit", false);

          const end = this.metrics.measureDBOperationDuration(
            "progress.findByEnrollmentIdAndLessonId",
            "SELECT"
          );
          const ormEntity = await this.repo.findOne({
            where: { enrollmentId, lessonId, deletedAt: null },
          });
          end();
          this.metrics.incrementDBRequestCounter("SELECT");

          if (!ormEntity) {
            span.setAttribute("db.found", false);
            return null;
          }
          span.setAttribute("db.found", true);

          // await this.redisService.set(cacheKey, ormEntity, 3600);

          span.setAttribute("cache.set", true);
          this.logger.debug(
            `Cached progress for enrollment ${enrollmentId} and lesson ${lessonId}`,
            { ctx: ProgressTypeOrmRepository.name }
          );
          return ProgressEntityMapper.toDomainProgress(ormEntity);
        } catch (error) {
          this.logger.error(
            `Failed to find progress by enrollment and lesson id: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }

  async delete(progress: Progress): Promise<void> {
    return this.tracer.startActiveSpan(
      "ProgressTypeOrmRepository.delete",
      async (span) => {
        try {
          progress.softDelete();

          span.setAttributes({
            "db.operation": "DELETE",
            "progress.id": progress.getId(),
            "progress.enrollment.id": progress.getEnrollmentId(),
          });

          const ormEntity = ProgressEntityMapper.toOrmProgress(progress);

          const end = this.metrics.measureDBOperationDuration(
            "progress.delete",
            "DELETE"
          );
          // Using primary key for delete operation
          const result = await this.repo.delete({ id: ormEntity.id });
          end();
          this.metrics.incrementDBRequestCounter("DELETE");
          span.setAttribute("progress.deleted", true);

          if (!result || !result.affected || result.affected === 0) {
            this.logger.warn(
              `Delete operation affected no rows for progress ${progress.getId()}`,
              { ctx: ProgressTypeOrmRepository.name }
            );
          }

          // await Promise.all([
          //   this.redisService.del(CACHE_KEYS.progress.progress(progress.getId())),
          //   this.redisService.del(
          //     CACHE_KEYS.progress.enrollment(progress.getEnrollmentId())
          //   ),
          // ]);
          const invalidated = CACHE_KEYS.progress.byInvalidateOnProgressChange(progress.getId(), progress.getEnrollmentId());
          span.setAttribute(
            "cache.invalidated.keys",
            JSON.stringify(invalidated)
          );
          this.logger.debug(
            `Invalidated cache for progress ${progress.getId()}`,
            { ctx: ProgressTypeOrmRepository.name }
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete progress: ${error.message}`,
            { ctx: ProgressTypeOrmRepository.name },
          );
          span.setAttribute("error", true);
          throw error;
        }
      }
    );
  }
}
