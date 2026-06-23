import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { GetEnrollmentDetailUseCase } from "src/application/use-cases/enrollment/get-enrollment-detail-use-case";
import { UnitType } from "src/domain/entities/progress.entity";

describe("GetEnrollmentDetailUseCase", () => {
  let useCase: GetEnrollmentDetailUseCase;
  let mockEnrollmentRepo: any;
  let mockCourseRepo: any;

  // Utility/factory fakes & values so we can compose domain-like objects
  const NOW = new Date();
  const enrollmentId = "enrl-111";
  const userId = "user-abc";
  const courseId = "course-xyz";
  const enrolledAt = NOW;
  const status = "active";
  const progressPercent = 87;

  const progressLessonFake = (lessonId, opts = {}) => ({
    getUnitType: () => UnitType.LESSON,
    getUnitId: () => lessonId,
    isCompleted: () => !!opts.completed,
    getCompletedAt: () => opts.completedAt ? new Date(opts.completedAt) : undefined,
  });
  const progressQuizFake = (quizId, opts = {}) => ({
    getUnitType: () => UnitType.QUIZ,
    getUnitId: () => quizId,
    isCompleted: () => !!opts.completed,
    getCompletedAt: () => opts.completedAt ? new Date(opts.completedAt) : undefined,
    getPassed: () => !!opts.passed,
    getScore: () => typeof opts.score === "number" ? opts.score : undefined,
  });

  const lesson1 = { getId: () => "les-1", getTitle: () => "Lesson 1", getOrder: () => 1, getDuration: () => 100 };
  const lesson2 = { getId: () => "les-2", getTitle: () => "Lesson 2", getOrder: () => 2, getDuration: () => 200 };
  const quiz = { 
    getId: () => "quiz-100", 
    getTitle: () => "Quiz Title", 
    getIsRequired: () => true, 
    getPassingScore: () => 70 
  };
  const section1 = { 
    getId: () => "sec-1",
    getTitle: () => "Section 1",
    getDescription: () => "Section 1 desc",
    getOrder: () => 1,
    getIsPublished: () => true,
    getLessons: () => [lesson1, lesson2],
    getQuiz: () => quiz,
  };
  const courseFake = {
    getSections: () => [section1]
  };

  const enrollmentFake = {
    getId: () => enrollmentId,
    getUserId: () => userId,
    getCourseId: () => courseId,
    getEnrolledAt: () => enrolledAt,
    getStatus: () => status,
    getProgressPercent: () => progressPercent,
    getProgressEntries: () => [
      progressLessonFake("les-1", { completed: true, completedAt: NOW }),
      progressLessonFake("les-2", { completed: false }),
      progressQuizFake("quiz-100", { completed: true, completedAt: NOW, passed: true, score: 85 }),
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnrollmentRepo = {
      findById: jest.fn(),
    };
    mockCourseRepo = {
      findById: jest.fn(),
    };
    useCase = new GetEnrollmentDetailUseCase(
      mockEnrollmentRepo,
      mockCourseRepo
    );
  });

  it("should return EnrollmentDetailDTO for a valid enrollment with progress (AAA)", async () => {
    // Arrange
    mockEnrollmentRepo.findById.mockResolvedValue(enrollmentFake);
    mockCourseRepo.findById.mockResolvedValue(courseFake);

    // Act
    const result = await useCase.execute(enrollmentId, userId);

    // Assert
    expect(mockEnrollmentRepo.findById).toHaveBeenCalledWith(enrollmentId, expect.any(Object));
    expect(mockCourseRepo.findById).toHaveBeenCalledWith(courseId);

    expect(result).toEqual({
      enrollmentId: enrollmentId,
      userId: userId,
      courseId: courseId,
      progressPercent,
      status,
      enrolledAt: enrolledAt.toISOString(),
      sections: [
        {
          id: section1.getId(),
          title: section1.getTitle(),
          description: section1.getDescription(),
          order: section1.getOrder(),
          isPublished: true,
          lessons: [
            {
              id: lesson1.getId(),
              title: lesson1.getTitle(),
              order: lesson1.getOrder(),
              duration: lesson1.getDuration(),
              completed: true,
              completedAt: NOW.toISOString(),
            },
            {
              id: lesson2.getId(),
              title: lesson2.getTitle(),
              order: lesson2.getOrder(),
              duration: lesson2.getDuration(),
              completed: false,
              completedAt: undefined,
            },
          ],
          quiz: {
            id: quiz.getId(),
            title: quiz.getTitle(),
            requirePassingScore: true,
            passingScore: 70,
            completed: true,
            passed: true,
            score: 85,
            completedAt: NOW.toISOString(),
          },
        },
      ],
    });
  });

  it("should throw NotFoundException if enrollment does not exist (AAA)", async () => {
    // Arrange
    mockEnrollmentRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(enrollmentId, userId)).rejects.toThrow(NotFoundException);
  });

  it("should throw ForbiddenException if user does not own enrollment (AAA)", async () => {
    // Arrange
    const otherUser = "different";
    const fake = { ...enrollmentFake, getUserId: () => otherUser };
    mockEnrollmentRepo.findById.mockResolvedValue(fake);

    // Act & Assert
    await expect(useCase.execute(enrollmentId, userId)).rejects.toThrow(ForbiddenException);
  });

  it("should throw NotFoundException if course does not exist (AAA)", async () => {
    // Arrange
    mockEnrollmentRepo.findById.mockResolvedValue(enrollmentFake);
    mockCourseRepo.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(enrollmentId, userId)).rejects.toThrow(NotFoundException);
  });

  it("should handle section without quiz and lesson with no progress (AAA)", async () => {
    // Arrange
    const lesson3 = { getId: () => "les-3", getTitle: () => "Lesson 3", getOrder: () => 1, getDuration: () => 90 };
    const sectionNoQuiz = {
      getId: () => "sec-2",
      getTitle: () => "Section No Quiz",
      getDescription: () => "",
      getOrder: () => 2,
      getIsPublished: () => false,
      getLessons: () => [lesson3],
      getQuiz: () => null,
    };
    const courseCustom = {
      getSections: () => [sectionNoQuiz]
    };
    const enrollmentCustom = {
      ...enrollmentFake,
      getProgressEntries: () => [], // No progress at all
    };
    mockEnrollmentRepo.findById.mockResolvedValue(enrollmentCustom);
    mockCourseRepo.findById.mockResolvedValue(courseCustom);

    // Act
    const result = await useCase.execute(enrollmentId, userId);

    // Assert
    expect(result.sections).toEqual([
      {
        id: sectionNoQuiz.getId(),
        title: sectionNoQuiz.getTitle(),
        description: sectionNoQuiz.getDescription(),
        order: sectionNoQuiz.getOrder(),
        isPublished: false,
        lessons: [
          {
            id: lesson3.getId(),
            title: lesson3.getTitle(),
            order: lesson3.getOrder(),
            duration: lesson3.getDuration(),
            completed: false,
            completedAt: undefined,
          }
        ],
        quiz: undefined,
      }
    ]);
  });
});
