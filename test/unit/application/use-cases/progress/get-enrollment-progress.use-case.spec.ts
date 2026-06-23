import { GetEnrollmentProgressUseCase } from "src/application/use-cases/progress/get-enrollment-progress.use-case";
import { EnrollmentNotFoundException } from "src/domain/exceptions/domain.exceptions";

describe("GetEnrollmentProgressUseCase", () => {
  let useCase: GetEnrollmentProgressUseCase;
  let mockEnrollmentRepo: any;
  let mockProgressRepo: any;

  const enrollmentId = "enroll-123";
  const userId = "user-11";
  const courseId = "course-42";

  const lessonProgressDomainMock = (overrides = {}) => ({
    isLesson: () => true,
    isQuiz: () => false,
    getUnitId: () => "lesson-aaa",
    getCompleted: () => true,
    getCompletedAt: () => new Date("2023-01-01T10:00:00.000Z"),
    getWatchTime: () => 123,
    getDuration: () => 456,
    ...overrides,
  });

  const quizProgressDomainMock = (overrides = {}) => ({
    isLesson: () => false,
    isQuiz: () => true,
    getUnitId: () => "quiz-bbb",
    getCompleted: () => false,
    getCompletedAt: () => null,
    getPassed: () => false,
    getScore: () => 0,
    getAttempts: () => 1,
    ...overrides,
  });

  const baseEnrollmentDomainMock = (overrides = {}) => ({
    getUserId: () => userId,
    getCourseId: () => courseId,
    getProgressPercent: () => 77.35,
    getCompletedLearningUnits: () => 5,
    getTotalLearningUnits: () => 10,
    getProgressEntries: jest.fn(() => []), // overriden in tests
    attachProgress: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    mockEnrollmentRepo = {
      findById: jest.fn(),
    };
    mockProgressRepo = {
      findByEnrollmentId: jest.fn(),
    };
    useCase = new GetEnrollmentProgressUseCase(
      mockEnrollmentRepo,
      mockProgressRepo
    );
    jest.clearAllMocks();
  });

  it("should return progress response when enrollment & progress loaded (AAA)", async () => {
    // Arrange
    const progressEntries = [
      lessonProgressDomainMock(),
      quizProgressDomainMock({
        getUnitId: () => "quiz-bbb-2",
        getCompleted: () => true,
        getPassed: () => true,
        getScore: () => 88,
        getAttempts: () => 2,
        getCompletedAt: () => new Date("2023-01-02T09:30:00Z"),
      }),
    ];
    const enrollment = baseEnrollmentDomainMock({
      getProgressEntries: jest.fn(() => progressEntries),
    });
    mockEnrollmentRepo.findById.mockResolvedValue(enrollment);

    // Act
    const result = await useCase.execute({ enrollmentId });

    // Assert
    expect(mockEnrollmentRepo.findById).toHaveBeenCalledWith(enrollmentId, {
      withCourse: false,
      withProgressSummary: true,
    });
    // No call to progressRepo.findByEnrollmentId, as progress is loaded

    expect(result).toEqual({
      enrollmentId,
      userId,
      courseId,
      overallProgress: 77.35,
      completedUnits: 5,
      totalUnits: 10,
      lessons: [
        {
          lessonId: "lesson-aaa",
          completed: true,
          completedAt: "2023-01-01T10:00:00.000Z",
          watchTime: 123,
          duration: 456,
        },
      ],
      quizzes: [
        {
          quizId: "quiz-bbb-2",
          completed: true,
          passed: true,
          score: 88,
          attempts: 2,
          completedAt: "2023-01-02T09:30:00.000Z",
        },
      ],
    });
  });

  it("should load progress from progressRepo if not present on enrollment (AAA)", async () => {
    // Arrange
    const enrollment = baseEnrollmentDomainMock({
      getProgressEntries: jest.fn(() => []), // no progress loaded
      attachProgress: jest.fn(),
    });
    mockEnrollmentRepo.findById.mockResolvedValue(enrollment);

    const loadedProgress = [
      quizProgressDomainMock({
        getUnitId: () => "quiz-123", getCompleted: () => false
      }),
    ];
    mockProgressRepo.findByEnrollmentId.mockResolvedValue(loadedProgress);

    // Act
    await useCase.execute({ enrollmentId });

    // Assert
    expect(mockProgressRepo.findByEnrollmentId).toHaveBeenCalledWith(enrollmentId);
    expect(enrollment.attachProgress).toHaveBeenCalledWith(loadedProgress); // enroll.attachProgress called with repo value
  });

  it("should throw EnrollmentNotFoundException if enrollment not found", async () => {
    // Arrange
    mockEnrollmentRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ enrollmentId })).rejects.toThrow(EnrollmentNotFoundException);
  });
});
