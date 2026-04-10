import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CategoryStats,
  ICategoryRepository,
} from "../../../domain/repositories/category.repository";
import { Category } from "../../../domain/entities/category.entity";
import { CategoryOrmEntity } from "../entities/category-orm.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CourseEntityMapper } from "../mappers/course.entity.mapper";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";
import { BaseRepository } from "./base.repository";

@Injectable()
export class CategoryTypeOrmRepository
  extends BaseRepository
  implements ICategoryRepository
{
  protected readonly contextName = CategoryTypeOrmRepository.name;

  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
    private readonly redis: ICacheService,
    logger: LoggingService,
    metrics: MetricsService,
    tracer: TracingService,
  ) {
    super(logger, tracer, metrics);
  }

  async create(category: Category): Promise<void> {
    return this.execute(
      "create",
      async (span) => {
        span.setAttributes({
          "category.id": category.getId(),
          "category.name": category.getName(),
        });

        const ormEntity = CourseEntityMapper.toOrmCategory(category);
        const saved = await this.repo.save(ormEntity);

        if (!saved) {
          this.logger.warn(
            `Create operation did not write to DB: Category ${category.getName()}`,
            { ctx: this.contextName },
          );
        } else {
          span.setAttribute("db.category.created", true);
        }

        await this.redis.del(CACHE_KEYS.category.all);
        this.logger.debug(`Category created: ${category.getName()}`, {
          ctx: this.contextName,
        });
      },
      { "db.operation": "INSERT" },
    );
  }

  async update(category: Category): Promise<void> {
    return this.execute(
      "update",
      async (span) => {
        span.setAttributes({
          "category.id": category.getId(),
        });

        const ormEntity = CourseEntityMapper.toOrmCategory(category);
        const saved = await this.repo.save(ormEntity);

        if (!saved) {
          this.logger.warn(
            `Update operation did not write to DB: Category ${category.getId()}`,
            { ctx: this.contextName },
          );
        }

        await this.redis.del(CACHE_KEYS.category.byId(category.getId()));
        await this.redis.del(CACHE_KEYS.category.all);
        this.logger.debug(`Category updated: ${category.getId()}`, {
          ctx: this.contextName,
        });
      },
      { "db.operation": "UPDATE" },
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute(
      "delete",
      async (span) => {
        const result = await this.repo.softDelete({ id });

        if (!result || !result.affected || result.affected === 0) {
          this.logger.warn(
            `Delete operation did not affect any category: ${id}`,
            { ctx: this.contextName },
          );
        }

        await this.redis.del(CACHE_KEYS.category.byId(id));
        await this.redis.del(CACHE_KEYS.category.all);
        this.logger.debug(`Category deleted: ${id}`, { ctx: this.contextName });
      },
      { id, "db.operation": "DELETE" },
    );
  }

  async getStats(top?: number): Promise<CategoryStats[]> {
    return this.execute(
      "getStats",
      async (span) => {
        const limit = top || 10;
        span.setAttribute("stats.limit", limit);

        const rawStats = await this.repo
          .createQueryBuilder("category")
          .leftJoin("category.courses", "courses")
          .select("category.name", "category")
          .addSelect("COUNT(courses.id)", "count")
          .groupBy("category.id")
          .addGroupBy("category.name")
          .orderBy("count", "DESC")
          .limit(limit)
          .getRawMany();

        const stats: CategoryStats[] = rawStats.map((row) => ({
          category: row.category,
          count: parseInt(row.count, 10),
        }));

        span.setAttribute("stats.returned", stats.length);
        return stats;
      },
      { "db.operation": "SELECT" },
    );
  }

  async findById(id: string): Promise<Category | null> {
    return this.execute(
      "findById",
      async (span) => {
        const cacheKey = CACHE_KEYS.category.byId(id);
        const cached = await this.redis.get<CategoryOrmEntity>(cacheKey);

        if (cached) {
          span.setAttribute("cache.hit", true);
          return CourseEntityMapper.toDomainCategory(cached);
        }
        span.setAttribute("cache.hit", false);

        const orm = await this.repo
          .createQueryBuilder("category")
          .leftJoinAndSelect("category.parent", "parent")
          .leftJoinAndSelect("category.subcategories", "subcategories")
          .loadRelationCountAndMap("category.courseCount", "category.courses")
          .where("category.id = :id", { id })
          .getOne();

        if (!orm) {
          span.setAttribute("db.found", false);
          return null;
        }

        await this.redis.set(cacheKey, orm, 3600);
        return CourseEntityMapper.toDomainCategory(orm);
      },
      { id, "db.operation": "SELECT" },
    );
  }
  async findBySlug(slug: string): Promise<Category | null> {
    return this.execute(
      "findById",
      async (span) => {
        const cacheKey = CACHE_KEYS.category.bySlug(slug);
        const cached = await this.redis.get<CategoryOrmEntity>(cacheKey);

        if (cached) {
          span.setAttribute("cache.hit", true);
          return CourseEntityMapper.toDomainCategory(cached);
        }
        span.setAttribute("cache.hit", false);

        const orm = await this.repo
          .createQueryBuilder("category")
          .leftJoinAndSelect("category.parent", "parent")
          .leftJoinAndSelect("category.subcategories", "subcategories")
          .loadRelationCountAndMap("category.courseCount", "category.courses")
          .where("category.slug = :slug", { slug })
          .getOne();

        if (!orm) {
          span.setAttribute("db.found", false);
          return null;
        }

        await this.redis.set(cacheKey, orm, 3600);
        return CourseEntityMapper.toDomainCategory(orm);
      },
      { slug, "db.operation": "SELECT" },
    );
  }

  async findAll(): Promise<Category[]> {
    return this.execute(
      "findAll",
      async (span) => {
        const cacheKey = CACHE_KEYS.category.all;
        const cached = await this.redis.get<CategoryOrmEntity[]>(cacheKey);

        if (cached) {
          span.setAttribute("cache.hit", true);
          return cached.map(CourseEntityMapper.toDomainCategory);
        }
        span.setAttribute("cache.hit", false);

        const entities = await this.repo
          .createQueryBuilder("category")
          .leftJoinAndSelect("category.parent", "parent")
          .leftJoinAndSelect("category.subcategories", "subcategories")
          .loadRelationCountAndMap("category.courseCount", "category.courses")
          .where("parent.id IS NULL")
          .getMany();

        await this.redis.set(cacheKey, entities, 3600);
        return entities.map(CourseEntityMapper.toDomainCategory);
      },
      { "db.operation": "SELECT" },
    );
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    return this.execute(
      "findSubcategories",
      async () => {
        const ormEntities = await this.repo.find({
          where: { parent: { id: parentId } },
          relations: ["subcategories"],
        });
        return ormEntities.map(CourseEntityMapper.toDomainCategory);
      },
      { parentId, "db.operation": "SELECT" },
    );
  }

  async findCoursesByCategory(categoryId: string): Promise<any[]> {
    return this.execute(
      "findCoursesByCategory",
      async (span) => {
        const category = await this.repo.findOne({
          where: { id: categoryId },
          relations: ["courses"],
        });

        const count = category?.courses?.length || 0;
        span.setAttribute("result.count", count);

        return category?.courses || [];
      },
      { categoryId, "db.operation": "SELECT" },
    );
  }
}
