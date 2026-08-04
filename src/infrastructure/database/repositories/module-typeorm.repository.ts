import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ModuleOrmEntity } from "../entities/module.orm-entity";
import { IModuleRepository } from "../../../domain/repositories/module.repository";
import { Module } from "../../../domain/entities/module.entity";
import { IMetricService } from "src/application/adaptors/metric.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ModuleEntityMapper } from "../mappers/module.entity.mapper";
import { ICacheService } from "src/application/adaptors/cache-service";
import { CACHE_KEYS } from "@/infrastructure/redis/cache-keys";
import { BaseRepository } from "./base.repository";

@Injectable()
export class ModuleTypeOrmRepository
  extends BaseRepository<Module, ModuleOrmEntity>
  implements IModuleRepository
{
  protected contextName: string = ModuleTypeOrmRepository.name;
  constructor(
    @InjectRepository(ModuleOrmEntity)
    repo: Repository<ModuleOrmEntity>,
    cache: ICacheService,
    logger: ILoggerService,
    tracer: ITraceService,
    metrics: IMetricService,
  ) {
    super(repo, logger, tracer, metrics, cache);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Module | null> {
    return await this.execute("findByIdempotencyKey", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "module.idempotencyKey": idempotencyKey,
      });

      this.metrics.incrementDBRequestCounter("SELECT");
      const end = this.metrics.measureDBOperationDuration(
        "module.findByIdempotencyKey",
        "SELECT",
      );

      // Try to find module by idempotencyKey
      const ormModule = await this.repo.findOne({
        where: { idempotencyKey },
        relations: {
          lessons: true,
          quiz: true,
        },
      });

      end();

      if (!ormModule) {
        this.logger.debug(
          `No module found for idempotencyKey: ${idempotencyKey}`,
          { ctx: ModuleTypeOrmRepository.name },
        );
        return null;
      }

      // Map ModuleOrmEntity to Module domain entity
      const module = ModuleEntityMapper.toDomainModule(ormModule);

      return module;
    });
  }

  async save(module: Module): Promise<void> {
    return await this.execute("save", async (span) => {
      span.setAttributes({
        "db.operation": "INSERT",
        "module.title": module.getTitle(),
      });
      const ormEntity = ModuleEntityMapper.toOrmModule(module);

      this.metrics.incrementDBRequestCounter("INSERT");
      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "module.save",
        "INSERT",
      );
      const result = await this.repo.save(ormEntity);
      end();

      if (!result) {
        this.logger.warn(
          `Save operation returned null or undefined for module ${module.getId()}`,
          { ctx: ModuleTypeOrmRepository.name },
        );
      }

      const cacheKeys = CACHE_KEYS.module.invalidateKeys(
        module.getId(),
        module.getCourseId(),
      );
      await Promise.all(cacheKeys.map((key) => this.cache.del(key)));
      span.setAttributes({
        "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
      });

      this.logger.debug(`Invalidated cache for module ${module.getId()}`, {
        ctx: ModuleTypeOrmRepository.name,
      });
    });
  }

  async update(module: Module): Promise<void> {
    return await this.execute("update", async (span) => {
      span.setAttributes({
        "db.operation": "INSERT",
        "module.title": module.getTitle(),
      });
      const ormEntity = ModuleEntityMapper.toOrmModule(module);

      this.metrics.incrementDBRequestCounter("INSERT");
      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "module.update",
        "INSERT",
      );
      const result = await this.repo.update(module.getId(), ormEntity);
      end();

      // .update returns UpdateResult, it always resolves, but check affected rows
      // "affected" property tells how many rows were affected
      if (!result || result.affected === 0) {
        this.logger.warn(
          `Update operation did not affect any records for module ${module.getId()}`,
          { ctx: ModuleTypeOrmRepository.name },
        );
      }

      const cacheKeys = CACHE_KEYS.module.invalidateKeys(
        module.getId(),
        module.getCourseId(),
      );
      await Promise.all(cacheKeys.map((key) => this.cache.del(key)));
      span.setAttributes({
        "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
      });

      this.logger.debug(`Invalidated cache for module ${module.getId()}`, {
        ctx: ModuleTypeOrmRepository.name,
      });
    });
  }

  async findById(id: string): Promise<Module | null> {
    return await this.execute("findById", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "module.id": id,
      });
      const cacheKey = CACHE_KEYS.module.byId(id);
      const cachedModule = await this.cache.get<ModuleOrmEntity>(cacheKey);
      if (cachedModule) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for module ${id}`, {
          ctx: ModuleTypeOrmRepository.name,
        });
        return ModuleEntityMapper.toDomainModule(cachedModule);
      }
      span.setAttribute("cache.hit", false);

      this.metrics.incrementDBRequestCounter("SELECT");
      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "module.findById",
        "SELECT",
      );
      const ormEntity = await this.repo.findOne({
        where: { id, deletedAt: null },
        relations: ["lessons"],
      });
      end();

      if (!ormEntity) {
        span.setAttribute("module.db.found", false);
        return null;
      }

      span.setAttribute("module.db.found", true);
      const module = ModuleEntityMapper.toDomainModule(ormEntity);
      await this.cache.set(cacheKey, ormEntity, 3600);
      this.logger.debug(`Cached module ${id}`, {
        ctx: ModuleTypeOrmRepository.name,
      });

      span.setAttribute("module.cache.set", true);
      return module;
    });
  }

  async findByCourseId(courseId: string): Promise<Module[]> {
    return await this.execute("findByCourseId", async (span) => {
      span.setAttributes({
        "db.operation": "SELECT",
        "course.id": courseId,
      });
      const cacheKey = CACHE_KEYS.module.byCourse(courseId);
      const cachedModules = await this.cache.get<ModuleOrmEntity[]>(cacheKey);
      if (cachedModules) {
        span.setAttribute("cache.hit", true);
        this.logger.debug(`Cache hit for modules of course ${courseId}`, {
          ctx: ModuleTypeOrmRepository.name,
        });
        return cachedModules.map(ModuleEntityMapper.toDomainModule);
      }
      span.setAttribute("cache.hit", false);

      this.metrics.incrementDBRequestCounter("SELECT");
      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "module.findByCourseId",
        "SELECT",
      );
      const ormEntities = await this.repo.find({
        where: { courseId, deletedAt: null },
        relations: ["lessons"],
      });
      end();

      const modules = ormEntities.map(ModuleEntityMapper.toDomainModule);
      await this.cache.set(cacheKey, ormEntities, 3600);
      this.logger.debug(`Cached modules for course ${courseId}`, {
        ctx: ModuleTypeOrmRepository.name,
      });
      return modules;
    });
  }

  async delete(module: Module): Promise<void> {
    return await this.execute("delete", async (span) => {
      span.setAttributes({
        "db.operation": "INSERT",
        "module.id": module.getId(),
        "module.title": module.getTitle(),
      });
      module.softDelete();
      // const ormEntity = ModuleEntityMapper.toOrmModule(module);

      this.metrics.incrementDBRequestCounter("DELETE");
      // Measure DB operation delay
      const end = this.metrics.measureDBOperationDuration(
        "module.delete",
        "INSERT",
      );
      const result = await this.repo.delete(module.getId());
      end();

      if (!result) {
        this.logger.warn(
          `Delete/save operation returned null or undefined for module ${module.getId()}`,
          { ctx: ModuleTypeOrmRepository.name },
        );
      }

      const cacheKeys = CACHE_KEYS.module.invalidateKeys(
        module.getId(),
        module.getCourseId(),
      );
      await Promise.all(cacheKeys.map((key) => this.cache.del(key)));
      span.setAttributes({
        "invalidated.cache.keys": `[ ${cacheKeys.join(", ")} ]`,
      });

      this.logger.debug(`Invalidated cache for module ${module.getId()}`, {
        ctx: ModuleTypeOrmRepository.name,
      });
    });
  }
}
