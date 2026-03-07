import { ReviewException } from "../exceptions/domain.exceptions";
import { User } from "./user.entity";

export class Review {
  private deletedAt?: Date;

  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly user: User,
    private readonly courseId: string,
    private readonly enrollmentId: string,
    private rating: number, // 1 to 5
    private comment: string,
    private createdAt?: Date,
    private updatedAt?: Date,
    deletedAt?: Date,
  ) {
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.deletedAt = deletedAt ? new Date(deletedAt) : undefined;
    this.validateRating();
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getUserId(): string {
    return this.userId;
  }
  getUser(): User {
    return this.user;
  }
  getCourseId(): string {
    return this.courseId;
  }
  getEnrollmentId(): string {
    return this.enrollmentId;
  }
  getRating(): number {
    return this.rating;
  }
  getComment(): string {
    return this.comment;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  //
  update(rating: number, comment: string): void {
    if (this.deletedAt) {
      throw new ReviewException("Cannot update a deleted review");
    }
    this.rating = rating;
    this.comment = comment;
    this.updatedAt = new Date();
    this.validateRating();
  }

  delete(): void {
    if (this.deletedAt) {
      throw new ReviewException("Review already deleted");
    }
    this.deletedAt = new Date();
    this.updatedAt = this.deletedAt;
  }

  restore(): void {
    if (!this.deletedAt) {
      throw new ReviewException("Review is not deleted");
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }

  validateRating(): void {
    if (this.rating < 1 || this.rating > 5) {
      throw new ReviewException("Rating must be between 1 and 5");
    }
  }

  isDeleted(): boolean {
    return !!this.deletedAt;
  }
}
