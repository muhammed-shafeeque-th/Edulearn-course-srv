import { Review } from "src/domain/entities/review.entity";
import { User } from "src/domain/entities/user.entity";
import { ReviewData } from "src/infrastructure/grpc/generated/course/types/review";

export class ReviewDto {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  enrollmentId: string;
  createdAt: Date;
  user: User;
  updatedAt: Date;

  static fromDomain(review: Review): ReviewDto {
    const dto = new ReviewDto();
    dto.id = review.getId();
    dto.courseId = review.getCourseId();
    dto.user = review.getUser();
    dto.comment = review.getComment();
    dto.rating = review.getRating();
    dto.enrollmentId = review.getEnrollmentId();
    dto.createdAt = review.getCreatedAt();
    dto.updatedAt = review.getUpdatedAt();
    return dto;
  }

  public toGrpcResponse = (): ReviewData => {
    return {
      id: this.id,
      userId: this.userId,
      courseId: this.courseId,
      rating: this.rating,
      user: this.user
        ? {
            id: this.user.getId(),
            name: this.user.getName(),
            avatar: this.user.getAvatar(),
            email: this.user.getEmail(),
          }
        : undefined,
      enrollmentId: this.enrollmentId,
      comment: this.comment,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  };
}
