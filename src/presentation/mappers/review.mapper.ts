import { Review } from "src/domain/entities/review.entity";
import { User } from "src/domain/entities/user.entity";
import { ReviewData } from "src/infrastructure/grpc/generated/course/types/review";

export class ReviewMapper {
  static toGrpcResponse(review: Review): ReviewData {
    return {
      id: review.getId(),
      courseId: review.getCourseId(),
      userId: review.getUserId(),
      user: review.getUser()
        ? {
            id: review.getUser().getId(),
            name: review.getUser().getName(),
            avatar: review.getUser().getAvatar(),
            email: review.getUser().getEmail(),
          }
        : undefined,
      comment: review.getComment(),
      rating: review.getRating(),
      enrollmentId: review.getEnrollmentId(),
      createdAt: review.getCreatedAt()?.toISOString(),
      updatedAt: review.getUpdatedAt()?.toISOString(),
    };
  }
}
