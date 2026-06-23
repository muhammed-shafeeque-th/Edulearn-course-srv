import { ReviewOrmEntity } from "../entities/review.entity";
import { Review } from "src/domain/entities/review.entity";
import { UserEntityMapper } from "./user.entity.mapper";

/**
 * ReviewEntityMapper handles mapping between domain entities and ORM/database entities.
 */
export class ReviewEntityMapper {
  // --- Review Mapping ---

  static toOrmReview(review: Review): ReviewOrmEntity {
    const orm = new ReviewOrmEntity();
    orm.id = review.getId();
    orm.user = UserEntityMapper.toOrmUser(review.getUser());
    orm.userId = review.getUserId();
    orm.courseId = review.getCourseId();
    orm.enrollmentId = review.getEnrollmentId();
    orm.rating = review.getRating();
    orm.comment = review.getComment();
    orm.createdAt = review.getCreatedAt();
    orm.updatedAt = review.getUpdatedAt();
    orm.deletedAt = review.getDeletedAt();
    return orm;
  }

  static toDomainReview(orm: ReviewOrmEntity): Review {
    const user = orm.user ? UserEntityMapper.toDomainUser(orm.user) : undefined;
    return new Review(
      orm.id,
      orm.userId,
      user,
      orm.courseId,
      orm.enrollmentId,
      orm.rating,
      orm.comment,
      orm.createdAt ? new Date(orm.createdAt) : undefined,
      orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    );
  }
}
