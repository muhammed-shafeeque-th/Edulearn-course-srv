import { AddReviewUseCase } from "src/application/use-cases/review/add-review.use-case";
import { ReviewDto } from "src/application/dtos/review.dto";
import { Review } from "src/domain/entities/review.entity";
import {
  AlreadyReviewedException,
  CourseNotFoundException,
  EnrollmentNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { IKafkaProducer } from "src/infrastructure/__kafka/custom/kafka.producer";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { KafkaTopics } from "src/shared/events/event.topics";

describe("AddReviewUseCase", () => {
  let useCase: AddReviewUseCase;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockEnrollmentRepository: jest.Mocked<IEnrollmentRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockKafkaProducer: jest.Mocked<IKafkaProducer>;
  let mockLogger: jest.Mocked<LoggingService>;
  let mockTracer: jest.Mocked<TracingService>;
  let mockSpan: any;

  const userId = "user-1";
  const enrollmentId = "enrollment-1";
  const courseId = "course-1";
  const rating = 4;
  const comment = "Nice course!";
  const reviewId = "review-xyz";
  const now = new Date().toISOString();

  // Domain mocks - type safe
  let enrollmentMock: {
    getUserId: () => string;
    getCourseId: () => string;
  };
  let courseMock: {
    rateCourse: (r: number) => void;
  };
  let reviewMock: Review;

  beforeEach(() => {
    // type safe with jest.Mocked
    mockReviewRepository = {
      findByUserAndCourse: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IReviewRepository>;
    mockEnrollmentRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IEnrollmentRepository>;
    mockCourseRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;
    mockKafkaProducer = {
      sendMessage: jest.fn(() => Promise.resolve()),
    } as unknown as jest.Mocked<IKafkaProducer>;
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;
    mockSpan = {
      setAttributes: jest.fn(),
      setAttribute: jest.fn(),
    };
    mockTracer = {
      startActiveSpan: jest.fn((name: string, cb: (span: any) => any) =>
        cb(mockSpan)
      ),
    } as unknown as jest.Mocked<TracingService>;

    enrollmentMock = {
      getUserId: jest.fn(() => userId),
      getCourseId: jest.fn(() => courseId),
    };
    courseMock = {
      rateCourse: jest.fn(),
    };

    // We need a real Review instance for proper typing
    reviewMock = new Review(
      reviewId,
      userId,
      courseId,
      enrollmentId,
      rating,
      comment,
      new Date(now),
      new Date(now)
    );

    // Spy on ReviewDto.fromDomain - must return a real ReviewDto
    jest.spyOn(ReviewDto, "fromDomain").mockImplementation((review: Review) => {
      return new ReviewDto(
        review.getId(),
        review.getUserId(),
        review.getCourseId(),
        review.getEnrollmentId(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt(),
        review.getUpdatedAt()
      );
    });

    // Spy on Review constructor to always create our reviewMock, but still type-safe
    jest.spyOn(Review.prototype, "constructor").mockImplementation(
      // @ts-expect-error only for test
      function (
        this: Review,
        id: string,
        userId: string,
        courseId: string,
        enrollmentId: string,
        rating: number,
        comment: string,
        createdAt?: Date,
        updatedAt?: Date
      ) {
        Object.assign(this, reviewMock);
      }
    );

    useCase = new AddReviewUseCase(
      mockReviewRepository,
      mockEnrollmentRepository,
      mockCourseRepository,
      mockKafkaProducer,
      mockLogger,
      mockTracer
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should add review successfully (AAA)", async () => {
      // Arrange
      mockEnrollmentRepository.findById.mockResolvedValue(enrollmentMock);
      mockCourseRepository.findById.mockResolvedValue(courseMock);
      mockReviewRepository.findByUserAndCourse.mockResolvedValue(null);
      mockReviewRepository.save.mockResolvedValue(undefined);
      mockCourseRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(
        userId,
        enrollmentId,
        rating,
        comment
      );

      // Assert
      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        "AddReviewUseCase.execute",
        expect.any(Function)
      );
      expect(mockEnrollmentRepository.findById).toHaveBeenCalledWith(
        enrollmentId
      );
      expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
      expect(mockReviewRepository.findByUserAndCourse).toHaveBeenCalledWith(
        userId,
        courseId
      );
      expect(courseMock.rateCourse).toHaveBeenCalledWith(rating);
      expect(mockReviewRepository.save).toHaveBeenCalledWith(
        expect.any(Review)
      );
      expect(mockCourseRepository.save).toHaveBeenCalledWith(courseMock);
      expect(mockKafkaProducer.sendMessage).toHaveBeenCalledWith(
        KafkaTopics.CourseReviewSubmitted,
        expect.objectContaining({
          userId,
          courseId,
          enrollmentId,
          reviewId: reviewId,
          rating,
          comment,
        })
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Review added for course ${courseId} by user ${userId}`,
        { ctx: "AddReviewUseCase" }
      );
      expect(result).toBeInstanceOf(ReviewDto);
      expect(result).toMatchObject({
        id: reviewId,
        userId,
        courseId,
        enrollmentId,
        rating,
        comment,
      });
    });

    it("should throw EnrollmentNotFoundException if enrollment not found", async () => {
      // Arrange
      mockEnrollmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(userId, enrollmentId, rating, comment)
      ).rejects.toBeInstanceOf(EnrollmentNotFoundException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Enrollment with ID"),
        { ctx: "AddReviewUseCase" }
      );
    });

    it("should throw CourseNotFoundException if course not found", async () => {
      // Arrange
      mockEnrollmentRepository.findById.mockResolvedValue(enrollmentMock);
      mockCourseRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(userId, enrollmentId, rating, comment)
      ).rejects.toBeInstanceOf(CourseNotFoundException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Course with ID"),
        { ctx: "AddReviewUseCase" }
      );
    });

    it("should throw EnrollmentNotFoundException if enrollment's user or course mismatch", async () => {
      // Arrange
      (enrollmentMock.getUserId as jest.Mock).mockReturnValue("another-user");
      mockEnrollmentRepository.findById.mockResolvedValue(enrollmentMock);
      mockCourseRepository.findById.mockResolvedValue(courseMock);

      // Act & Assert
      await expect(
        useCase.execute(userId, enrollmentId, rating, comment)
      ).rejects.toBeInstanceOf(EnrollmentNotFoundException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Enrollment info mismatch"),
        { ctx: "AddReviewUseCase" }
      );
    });

    it("should throw AlreadyReviewedException if user has already reviewed", async () => {
      // Arrange
      mockEnrollmentRepository.findById.mockResolvedValue(enrollmentMock);
      mockCourseRepository.findById.mockResolvedValue(courseMock);
      mockReviewRepository.findByUserAndCourse.mockResolvedValue({} as Review);

      // Act & Assert
      await expect(
        useCase.execute(userId, enrollmentId, rating, comment)
      ).rejects.toBeInstanceOf(AlreadyReviewedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("already reviewed course"),
        { ctx: "AddReviewUseCase" }
      );
    });

    it("should log error if Kafka sendMessage throws", async () => {
      // Arrange
      mockEnrollmentRepository.findById.mockResolvedValue(enrollmentMock);
      mockCourseRepository.findById.mockResolvedValue(courseMock);
      mockReviewRepository.findByUserAndCourse.mockResolvedValue(null);
      mockReviewRepository.save.mockResolvedValue(undefined);
      mockCourseRepository.save.mockResolvedValue(undefined);

      const kafkaErr = new Error("Kafka fail");
      mockKafkaProducer.sendMessage.mockRejectedValue(kafkaErr);

      // Act
      const promise = useCase.execute(userId, enrollmentId, rating, comment);

      // Because the error in Kafka .catch is async, we need to await for the microtask
      await promise;
      await new Promise((res) => setImmediate(res));

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send COURSE_REVIEWED event"),
        expect.objectContaining({ error: kafkaErr, ctx: "AddReviewUseCase" })
      );
    });
  });
});
