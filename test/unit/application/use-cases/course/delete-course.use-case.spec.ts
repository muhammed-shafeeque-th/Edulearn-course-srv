import { DeleteCourseUseCase } from "src/application/use-cases/course/delete-course.use-case";
import { CourseNotFoundException, UnauthorizedException } from "src/domain/exceptions/domain.exceptions";

// Arrange: Mock dependencies
const mockCourseRepository = {
  findById: jest.fn(),
  delete: jest.fn(),
};
const mockLogger = {
  log: jest.fn(),
};
const mockSpan = {
  setAttributes: jest.fn(),
};
const mockTracer = {
  startActiveSpan: jest.fn((name, cb) => cb(mockSpan)),
};

const mockCourse = {
  getInstructorId: jest.fn(),
  softDelete: jest.fn(),
};

describe("DeleteCourseUseCase", () => {
  let useCase: DeleteCourseUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteCourseUseCase(
      mockCourseRepository as any,
      mockLogger as any,
      mockTracer as any
    );
  });

  it("should delete the course when user is authorized and course exists (AAA)", async () => {
    // Arrange
    const courseId = "course-123";
    const userId = "user-456";
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockCourse.getInstructorId.mockReturnValue(userId);

    // Act
    await useCase.execute(courseId, userId);

    // Assert
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      "DeleteCourseUseCase.execute",
      expect.any(Function)
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      `Deleting course ${courseId}`,
      expect.objectContaining({ ct: "DeleteCourseUseCase" })
    );
    expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
    expect(mockCourse.getInstructorId).toHaveBeenCalled();
    expect(mockSpan.setAttributes).toHaveBeenCalledWith({ "course.id": courseId });
    expect(mockCourse.softDelete).toHaveBeenCalled();
    expect(mockCourseRepository.delete).toHaveBeenCalledWith(mockCourse);
    expect(mockSpan.setAttributes).toHaveBeenCalledWith({ "course.deleted": true });
    expect(mockLogger.log).toHaveBeenCalledWith(
      `Course ${courseId} deleted`,
      expect.objectContaining({ ctx: "DeleteCourseUseCase" })
    );
  });

  it("should throw CourseNotFoundException when course does not exist (AAA)", async () => {
    // Arrange
    const courseId = "missing";
    const userId = "user";
    mockCourseRepository.findById.mockResolvedValue(undefined);

    // Act & Assert
    await expect(useCase.execute(courseId, userId)).rejects.toThrow(CourseNotFoundException);
    expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
  });

  it("should throw UnauthorizedException when user is not the instructor (AAA)", async () => {
    // Arrange
    const courseId = "course-001";
    const userId = "user-not-instructor";
    mockCourseRepository.findById.mockResolvedValue(mockCourse);
    mockCourse.getInstructorId.mockReturnValue("different-instructor");

    // Act & Assert
    await expect(useCase.execute(courseId, userId)).rejects.toThrow(UnauthorizedException);
    expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
    expect(mockCourse.getInstructorId).toHaveBeenCalled();
    expect(mockCourse.softDelete).not.toHaveBeenCalled();
    expect(mockCourseRepository.delete).not.toHaveBeenCalled();
  });
});
