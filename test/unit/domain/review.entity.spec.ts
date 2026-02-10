import { User } from "src/domain/entities/user.entity";
import { Review } from "../../../src/domain/entities/review.entity";
import { ReviewException } from "../../../src/domain/exceptions/domain.exceptions";

describe("Review Entity", () => {
  const baseUser = {
    id: "usr-123",
    avatar: "user-avatar",
    email: "user-email",
    name: "user-1",
  };

  const baseProps = {
    id: "review-1",
    userId: "user-1",
    courseId: "course-1",
    enrollmentId: "enroll-1",
    rating: 4,
    comment: "Great course!",
    createdAt: new Date("2023-02-01T10:00:00Z"),
    updatedAt: new Date("2023-02-01T11:00:00Z"),
    deletedAt: undefined,
  };

  it("should create a review with all properties (AAA)", () => {
    // Arrange & Act

    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
      baseProps.createdAt,
      baseProps.updatedAt,
      baseProps.deletedAt,
    );

    // Assert
    expect(review.getId()).toBe("review-1");
    expect(review.getUserId()).toBe("user-1");
    expect(review.getCourseId()).toBe("course-1");
    expect(review.getEnrollmentId()).toBe("enroll-1");
    expect(review.getRating()).toBe(4);
    expect(review.getComment()).toBe("Great course!");
    expect(review.getCreatedAt().toISOString()).toBe(
      "2023-02-01T10:00:00.000Z",
    );
    expect(review.getUpdatedAt().toISOString()).toBe(
      "2023-02-01T11:00:00.000Z",
    );
    expect(review.getDeletedAt()).toBeUndefined();
    expect(review.isDeleted()).toBe(false);
  });

  it("should update rating and comment (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );
    const before = review.getUpdatedAt();

    // Act
    review.update(5, "Amazing experience!");

    // Assert
    expect(review.getRating()).toBe(5);
    expect(review.getComment()).toBe("Amazing experience!");
    expect(review.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it("should throw ReviewException when updating deleted review (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );
    review.delete();

    // Act & Assert
    expect(() => review.update(2, "Changed my mind")).toThrow(ReviewException);
    expect(() => review.update(2, "Changed my mind")).toThrow(/deleted review/);
  });

  it("should soft-delete review (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );
    expect(review.getDeletedAt()).toBeUndefined();

    // Act
    review.delete();

    // Assert
    const deletedAt = review.getDeletedAt();
    expect(deletedAt).toBeInstanceOf(Date);
    expect(review.isDeleted()).toBe(true);
    expect(review.getUpdatedAt().getTime()).toBe(deletedAt!.getTime());
  });

  it("should throw ReviewException when deleting already deleted review (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );
    review.delete();

    // Act & Assert
    expect(() => review.delete()).toThrow(ReviewException);
    expect(() => review.delete()).toThrow(/already deleted/);
  });

  it("should restore a deleted review (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );
    review.delete();
    expect(review.isDeleted()).toBe(true);

    // Act
    review.restore();

    // Assert
    expect(review.getDeletedAt()).toBeUndefined();
    expect(review.isDeleted()).toBe(false);
    // updatedAt should be touched
    expect(review.getUpdatedAt()).toBeDefined();
  });

  it("should throw ReviewException when restoring not deleted review (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );

    // Act & Assert
    expect(() => review.restore()).toThrow(ReviewException);
    expect(() => review.restore()).toThrow(/not deleted/);
  });

  it("should throw ReviewException if rating out of range during construction (AAA)", () => {
    // Arrange, Act & Assert
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    expect(
      () =>
        new Review(
          baseProps.id,
          baseProps.userId,
          user,
          baseProps.courseId,
          baseProps.enrollmentId,
          6,
          baseProps.comment,
        ),
    ).toThrow(ReviewException);

    expect(
      () =>
        new Review(
          baseProps.id,
          baseProps.userId,
          user,
          baseProps.courseId,
          baseProps.enrollmentId,
          0,
          baseProps.comment,
        ),
    ).toThrow(ReviewException);
  });

  it("should throw ReviewException if rating out of range on update (AAA)", () => {
    // Arrange

    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      3,
      baseProps.comment,
    );

    // Act & Assert
    expect(() => review.update(0, "bad")).toThrow(ReviewException);
    expect(() => review.update(6, "too good")).toThrow(
      /Rating must be between 1 and 5/,
    );
  });

  it("isDeleted returns false if never deleted, true if deleted (AAA)", () => {
    // Arrange
    const user = new User(
      baseUser.id,
      baseUser.name,
      baseUser.avatar,
      baseUser.email,
    );

    const review = new Review(
      baseProps.id,
      baseProps.userId,
      user,
      baseProps.courseId,
      baseProps.enrollmentId,
      baseProps.rating,
      baseProps.comment,
    );

    // Assert - before deletion
    expect(review.isDeleted()).toBe(false);
    review.delete();
    expect(review.isDeleted()).toBe(true);
    review.restore();
    expect(review.isDeleted()).toBe(false);
  });
});
