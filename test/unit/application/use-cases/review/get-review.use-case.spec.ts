import { GetReviewUseCase } from "src/application/use-cases/review/get-review.use-case";
import { ReviewDto } from "src/application/dtos/review.dto";
import { Review } from "src/domain/entities/review.entity";
import { ReviewNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IReviewRepository } from "src/domain/repositories/review.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

describe("GetReviewUseCase", () => {
  let useCase: GetReviewUseCase;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockLogger: jest.Mocked<LoggingService>;
  let mockTracer: jest.Mocked<TracingService>;
  let mockSpan: any;

  const reviewId = "review-123";
  const userId = "user-1";
  const courseId = "course-1";
  const enrollmentId = "enrollment-1";
  const rating = 5;
  const comment = "Test Review";
  const now = new Date();

  // Use a real Review entity for type safety
  let reviewMock: Review;

  beforeEach(() => {
    mockReviewRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IReviewRepository>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;

    mockSpan = {
      setAttributes: jest.fn(),
      setAttribute: jest.fn(),
    };

    mockTracer = {
      startActiveSpan: jest.fn((name: string, cb: (span: any) => any) => cb(mockSpan)),
    } as unknown as jest.Mocked<TracingService>;

    reviewMock = new Review(
      reviewId,
      userId,
      courseId,
      enrollmentId,
      rating,
      comment,
      now,
      now
    );

    jest.spyOn(ReviewDto, "fromDomain").mockImplementation((review: Review) => {
      return new ReviewDto(
        review.getId(),
        review.getUserId(),
        review.getCourseId(),
        review.getEnrollmentId(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt(),
        review.getUpdatedAt(),
      );
    });

    useCase = new GetReviewUseCase(mockReviewRepository, mockLogger, mockTracer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should fetch a review successfully (AAA)", async () => {
      // Arrange
      mockReviewRepository.findById.mockResolvedValue(reviewMock);

      // Act
      const result = await useCase.execute(reviewId);

      // Assert
      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        "GetReviewsUseCase.execute",
        expect.any(Function)
      );
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        "review.id": reviewId,
      });
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Fetching review ${reviewId}`,
        { ctx: GetReviewUseCase.name }
      );
      expect(mockReviewRepository.findById).toHaveBeenCalledWith(reviewId);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith("review.found", true);
      expect(ReviewDto.fromDomain).toHaveBeenCalledWith(reviewMock);
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Found review ${reviewId} `,
        { ctx: GetReviewUseCase.name }
      );

      // The result must be a ReviewDto with correct properties
      expect(result).toEqual(
        expect.objectContaining({
          id: reviewId,
          userId,
          courseId,
          enrollmentId,
          rating,
          comment,
          createdAt: now,
          updatedAt: now,
        })
      );
    });

    it("should throw ReviewNotFoundException if review does not exist (AAA)", async () => {
      // Arrange
      mockReviewRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(reviewId)).rejects.toThrow(
        new ReviewNotFoundException(`Not found review ${reviewId}`)
      );
      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        "GetReviewsUseCase.execute",
        expect.any(Function)
      );
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        "review.id": reviewId,
      });
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Fetching review ${reviewId}`,
        { ctx: GetReviewUseCase.name }
      );
      expect(mockReviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith("review.found", false);
    });
  });
});

