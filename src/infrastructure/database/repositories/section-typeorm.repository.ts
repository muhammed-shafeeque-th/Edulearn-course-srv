import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SectionOrmEntity } from "../entities/section.orm-entity";
import { ISectionRepository } from "../../../domain/repositories/section.repository";
import { Section } from "../../../domain/entities/section.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { SectionEntityMapper } from "../mappers/section.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";



@Injectable()
export class SectionTypeOrmRepository implements ISectionRepository {
  constructor(
    @InjectRepository(SectionOrmEntity)
    private readonly repo: Repository<SectionOrmEntity>,
    private readonly redisService: ICacheService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService
  ) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<Section | null> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.findByIdempotencyKey",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "section.idempotencyKey": idempotencyKey,
        });

        this.metrics.incrementDBRequestCounter("SELECT");
        const end = this.metrics.measureDBOperationDuration(
          "section.findByIdempotencyKey",
          "SELECT"
        );

        // Try to find section by idempotencyKey
        const ormSection = await this.repo.findOne({
          where: { idempotencyKey },
          relations: {
            lessons: true,
            quiz: true,
          },
        });

        end();

        if (!ormSection) {
          this.logger.debug(
            `No section found for idempotencyKey: ${idempotencyKey}`,
            { ctx: SectionTypeOrmRepository.name }
          );
          return null;
        }

        // Map SectionOrmEntity to Section domain entity
        const section = SectionEntityMapper.toDomainSection(ormSection);

        return section;
      }
    );
  }

  async save(section: Section): Promise<void> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.save",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "section.title": section.getTitle(),
        });
        const ormEntity = SectionEntityMapper.toOrmSection(section);

        this.metrics.incrementDBRequestCounter("INSERT");
        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "section.save",
          "INSERT"
        );
        const result = await this.repo.save(ormEntity);
        end();

        if (!result) {
          this.logger.warn(
            `Save operation returned null or undefined for section ${section.getId()}`,
            { ctx: SectionTypeOrmRepository.name }
          );
        }

        const cacheKeys = CACHE_KEYS.section.invalidateKeys(section.getId(), section.getCourseId());
        await Promise.all(cacheKeys.map((key) => this.redisService.del(key)));
        span.setAttributes({
          "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
        });

        this.logger.debug(`Invalidated cache for section ${section.getId()}`, {
          ctx: SectionTypeOrmRepository.name,
        });
      }
    );
  }

  async update(section: Section): Promise<void> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.update",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "section.title": section.getTitle(),
        });
        const ormEntity = SectionEntityMapper.toOrmSection(section);

        this.metrics.incrementDBRequestCounter("INSERT");
        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "section.update",
          "INSERT"
        );
        const result = await this.repo.update(section.getId(), ormEntity);
        end();

        // .update returns UpdateResult, it always resolves, but check affected rows
        // "affected" property tells how many rows were affected
        if (!result || result.affected === 0) {
          this.logger.warn(
            `Update operation did not affect any records for section ${section.getId()}`,
            { ctx: SectionTypeOrmRepository.name }
          );
        }

        const cacheKeys = CACHE_KEYS.section.invalidateKeys(section.getId(), section.getCourseId());
        await Promise.all(cacheKeys.map((key) => this.redisService.del(key)));
        span.setAttributes({
          "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
        });

        this.logger.debug(`Invalidated cache for section ${section.getId()}`, {
          ctx: SectionTypeOrmRepository.name,
        });
      }
    );
  }

  async findById(id: string): Promise<Section | null> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.findById",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "section.id": id,
        });
        const cacheKey = CACHE_KEYS.section.byId(id);
        const cachedSection =
          await this.redisService.get<SectionOrmEntity>(cacheKey);
        if (cachedSection) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for section ${id}`, {
            ctx: SectionTypeOrmRepository.name,
          });
          return SectionEntityMapper.toDomainSection(cachedSection);
        }
        span.setAttribute("cache.hit", false);

        this.metrics.incrementDBRequestCounter("SELECT");
        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "section.findById",
          "SELECT"
        );
        const ormEntity = await this.repo.findOne({
          where: { id, deletedAt: null },
          relations: ["lessons"],
        });
        end();

        if (!ormEntity) {
          span.setAttribute("section.db.found", false);
          return null;
        }

        span.setAttribute("section.db.found", true);
        const section = SectionEntityMapper.toDomainSection(ormEntity);
        await this.redisService.set(cacheKey, ormEntity, 3600);
        this.logger.debug(`Cached section ${id}`, {
          ctx: SectionTypeOrmRepository.name,
        });

        span.setAttribute("section.cache.set", true);
        return section;
      }
    );
  }

  async findByCourseId(courseId: string): Promise<Section[]> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.findByCourseId",
      async (span) => {
        span.setAttributes({
          "db.operation": "SELECT",
          "course.id": courseId,
        });
        const cacheKey = CACHE_KEYS.section.byCourse(courseId);
        const cachedSections =
          await this.redisService.get<SectionOrmEntity[]>(cacheKey);
        if (cachedSections) {
          span.setAttribute("cache.hit", true);
          this.logger.debug(`Cache hit for sections of course ${courseId}`, {
            ctx: SectionTypeOrmRepository.name,
          });
          return cachedSections.map(SectionEntityMapper.toDomainSection);
        }
        span.setAttribute("cache.hit", false);

        this.metrics.incrementDBRequestCounter("SELECT");
        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "section.findByCourseId",
          "SELECT"
        );
        const ormEntities = await this.repo.find({
          where: { courseId, deletedAt: null },
          relations: ["lessons"],
        });
        end();

        const sections = ormEntities.map(SectionEntityMapper.toDomainSection);
        await this.redisService.set(cacheKey, ormEntities, 3600);
        this.logger.debug(`Cached sections for course ${courseId}`, {
          ctx: SectionTypeOrmRepository.name,
        });
        return sections;
      }
    );
  }

  async delete(section: Section): Promise<void> {
    return await this.tracer.startActiveSpan(
      "SectionTypeOrmRepository.delete",
      async (span) => {
        span.setAttributes({
          "db.operation": "INSERT",
          "section.id": section.getId(),
          "section.title": section.getTitle(),
        });
        section.softDelete();
        // const ormEntity = SectionEntityMapper.toOrmSection(section);

        this.metrics.incrementDBRequestCounter("DELETE");
        // Measure DB operation delay
        const end = this.metrics.measureDBOperationDuration(
          "section.delete",
          "INSERT"
        );
        const result = await this.repo.delete(section.getId());
        end();

        if (!result) {
          this.logger.warn(
            `Delete/save operation returned null or undefined for section ${section.getId()}`,
            { ctx: SectionTypeOrmRepository.name }
          );
        }

        const cacheKeys = CACHE_KEYS.section.invalidateKeys(section.getId(), section.getCourseId());
        await Promise.all(cacheKeys.map((key) => this.redisService.del(key)));
        span.setAttributes({
          "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
        });

        this.logger.debug(`Invalidated cache for section ${section.getId()}`, {
          ctx: SectionTypeOrmRepository.name,
        });
      }
    );
  }
}
