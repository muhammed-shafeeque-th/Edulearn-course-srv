import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IReviewRepository, ReviewBreakDown } from "../../../domain/repositories/review.repository";
import { Review } from "../../../domain/entities/review.entity";
import { ReviewOrmEntity } from "../entities/review.entity";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { MetricsService } from "src/infrastructure/observability/metrics/metrics.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { ReviewEntityMapper } from "../mappers/review.entity.mapper";
import { UserOrmEntity } from "../entities/user.entity";
import { UserEntityMapper } from "../mappers/user.entity.mapper";


@Injectable()
export class ReviewTypeOrmRepository implements IReviewRepository {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly repo: Repository<ReviewOrmEntity>,
    private readonly logger: LoggingService,
    private readonly metrics: MetricsService,
    private readonly tracer: TracingService,
    private readonly dataSource: DataSource

  ) { }

  async save(review: Review): Promise<void> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.save",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "INSERT",
          "review.user.id": review.getUserId(),
        });

        await this.dataSource.transaction(async (manager) => {
          const userRepo = manager.getRepository(UserOrmEntity);
          const reviewRepo = manager.getRepository(ReviewOrmEntity);

          const ormEntity = ReviewEntityMapper.toOrmReview(review);

          // Ensure user exists or create from review domain entity
          let user = await userRepo.findOne({
            where: { id: review.getUserId() },
          });

          if (!user) {
            const domainUser = review.getUser();
            if (!domainUser) {
              this.logger.error(
                `User entity missing for review with id ${review.getId()} and userId ${review.getUserId()}`,
                { ctx: ReviewTypeOrmRepository.name }
              );
              throw new Error("User entity must be provided on Review domain object when user is missing");
            }
            user = UserEntityMapper.toOrmUser(domainUser);
            await userRepo.save(user);
          }

          ormEntity.user = user;
          ormEntity.userId = user.id;

          const end = this.metrics.measureDBOperationDuration("review.save", "INSERT");
          let result: ReviewOrmEntity | null = null;

          try {
            result = await reviewRepo.save(ormEntity);
            this.metrics.incrementDBRequestCounter("INSERT");
            end();
          } catch (error: any) {
            end();
            this.logger.error(
              `Failed to save review ${review.getId()}: ${error?.message}`,
              { ctx: ReviewTypeOrmRepository.name, error }
            );
            span.setAttribute("review.saved", false);
            throw error;
          }

          if (!result) {
            this.logger.warn(
              `Save operation returned null or undefined for review ${review.getId()}`,
              { ctx: ReviewTypeOrmRepository.name }
            );
          } else {
            this.logger.debug("Review has been successfully saved to DB", {
              ctx: ReviewTypeOrmRepository.name,
            });
            span.setAttribute("review.saved", true);
          }


        });
      }
    );
  }

  async findById(id: string): Promise<Review | null> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.findById",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "SELECT",
          "review.id": id,
        });

        span.setAttribute("redis.cache.review.hit", false);

        const end = this.metrics.measureDBOperationDuration("review.findOne", "SELECT");
        const ormEntity = await this.repo.findOne({ where: { id } });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        if (!ormEntity) {
          span.setAttribute("db.review.status", "Not found");
          return null;
        }
        span.setAttribute("db.review.status", "found");

        const review = ReviewEntityMapper.toDomainReview(ormEntity);
        return review;
      },
    );
  }

  async findByCourseId(
    courseId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "ASC" | "DESC" = "ASC",
    minRating?: number,
  ): Promise<{ reviews: Review[]; total: number }> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.findByCourseId",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "SELECT",
          "review.course.id": courseId,
        });

        span.setAttribute("redis.cache.review.hit", false);

        const end = this.metrics.measureDBOperationDuration(
          "review.findByCourseId",
          "SELECT",
        );
        const queryBuilder = this.repo
          .createQueryBuilder("review")
          .leftJoinAndSelect("review.user", "user")
          .where("review.courseId = :courseId", { courseId })
          .skip((page - 1) * limit)
          .take(limit)
          .orderBy(`review.${sortBy}`, sortOrder);

        if (minRating !== undefined) {
          queryBuilder.andWhere("review.rating >= :minRating", { minRating });
        }

        const [ormEntities, total] = await queryBuilder.getManyAndCount();
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        const reviews = ormEntities.map(ReviewEntityMapper.toDomainReview);
        return { reviews, total };
      },
    );
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Review | null> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.findByUserAndCourse",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "SELECT",
          "review.course.id": courseId,
          "review.course.user.id": userId,
        });

        const end = this.metrics.measureDBOperationDuration(
          "review.findByUserAndCourse",
          "SELECT",
        );
        const ormEntity = await this.repo.findOne({
          where: { userId, courseId },
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        if (!ormEntity) {
          span.setAttribute("db.cache.review.status", "Not found");
          return null;
        }

        span.setAttribute("db.cache.review.status", "Found");
        const review = ReviewEntityMapper.toDomainReview(ormEntity);
        return review;
      },
    );
  }

  async delete(review: Review): Promise<void> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.delete",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "DELETE",
          "review.id": review.getId(),
          "review.course.id": review.getCourseId(),
          "review.course.user.id": review.getUserId(),
        });

        const end = this.metrics.measureDBOperationDuration(
          "review.delete",
          "DELETE",
        );
        const result = await this.repo.delete({ id: review.getId() });
        end();
        this.metrics.incrementDBRequestCounter("DELETE");

        // Check if the delete operation affected any rows (review was actually deleted)
        if (!result || !("affected" in result) || result.affected === 0) {
          this.logger.warn(
            `Delete operation did not affect any rows for review ${review.getId()}`,
            { ctx: ReviewTypeOrmRepository.name }
          );
        }

        this.logger.debug(
          `Deleted review ${review.getId()}`,
          { ctx: ReviewTypeOrmRepository.name },
        );
      },
    );
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Review | null> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.findByEnrollmentId",
      async (span) => {
        span.setAttributes({
          "db.review.operation": "SELECT",
          "review.enrollment.id": enrollmentId,
        });


        const end = this.metrics.measureDBOperationDuration(
          "review.findByEnrollmentId",
          "SELECT",
        );
        const ormEntity = await this.repo.findOne({
          where: { enrollmentId }
        });
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        if (!ormEntity) {
          span.setAttribute("db.cache.review.status", "Not found");
          return null;
        }
        span.setAttribute("db.cache.review.status", "Found");
        const review = ReviewEntityMapper.toDomainReview(ormEntity);
        return review;
      }
    );
  }

  async getCourseRatingsBreakdown(courseId: string): Promise<ReviewBreakDown> {
    return await this.tracer.startActiveSpan(
      "ReviewTypeOrmRepository.getCourseRatingsBreakdown",
      async (span) => {
        span.setAttribute("db.review.operation", "SELECT_BREAKDOWN");
        span.setAttribute("review.course.id", courseId);


        const end = this.metrics.measureDBOperationDuration(
          "review.getCourseRatingsBreakdown",
          "SELECT"
        );

        const qb = this.repo.createQueryBuilder("review")
          .select("review.rating", "rating")
          .addSelect("COUNT(*)", "count")
          .where("review.courseId = :courseId", { courseId })
          .groupBy("review.rating");

        const result = await qb.getRawMany();
        end();
        this.metrics.incrementDBRequestCounter("SELECT");

        // Create breakdown with zero-initialized values
        const breakdown: ReviewBreakDown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const row of result) {
          const rating = Number(row.rating);
          if (breakdown.hasOwnProperty(rating)) {
            breakdown[rating as 1 | 2 | 3 | 4 | 5] = Number(row.count);
          }
        }

        this.logger.debug(
          `Calculated  ratings breakdown for course ${courseId}`,
          { ctx: ReviewTypeOrmRepository.name }
        );
        span.setAttribute("db.ratings_breakdown.fetched", true);

        return breakdown;
      }
    );
  }

}
