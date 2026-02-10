import { CreateCourseUseCase } from "src/application/use-cases/course/create-course.use-case";
import { CourseAlreadyExistException } from "src/domain/exceptions/domain.exceptions";
import { Course } from "src/domain/entities/course.entity";
import { Instructor } from "src/domain/entities/user.entity";
import { KafkaTopics } from "src/shared/events/event.topics";
import { CourseCreatedEvent } from "src/domain/events/review.events";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "fake-uuid"),
}));

// Fake/mock dependencies
const mockCourseRepository = {
  findByIdempotencyKey: jest.fn(),
  findBySlug: jest.fn(),
  save: jest.fn(),
};
const mockPublishService = {
  sendMessage: jest.fn(),
};
const mockLogger = {
  info: jest.fn(),
};
const mockSpan = {
  setAttribute: jest.fn(),
};
const mockTracer = {
  startActiveSpan: jest.fn((name, cb) => cb(mockSpan)),
};

const mockInstructor = {
  id: "inst-1",
  name: "John Doe",
  avatar: "avatar.png",
  email: "john@example.com",
};
const validPayload = {
  title: "Awesome Course",
  subTitle: "Become awesome",
  category: "Development",
  subCategory: "Web",
  language: "en",
  subtitleLanguage: "es",
  level: "Beginner",
  topics: ["Node.js", "TypeScript"],
  durationValue: "120",
  durationUnit: "minutes",
  instructor: mockInstructor,
  instructorId: "inst-1",
};

const fakeCourseInstance = {
  getTitle: () => "Awesome Course",
  getSlug: () => "awesome-course",
  getInstructorId: () => "inst-1",
  getStatus: () => "draft",
  getCreatedAt: () => new Date("2024-06-10T10:00:00Z"),
  getId: () => "fake-uuid"
};

jest.mock("src/domain/entities/course.entity", () => {
  return {
    Course: jest.fn().mockImplementation(() => fakeCourseInstance),
  };
});
jest.mock("src/domain/entities/instructor.entity", () => {
  return {
    Instructor: jest.fn().mockImplementation(() => mockInstructor),
  };
});
jest.mock("slugify", () => (str: string) => str.toLowerCase().replace(/ /g, '-'));

// minimal mock for CourseDto
const asDto = { id: "fake-uuid", title: "Awesome Course" };
jest.mock("src/application/dtos/course.dto", () => ({
  CourseDto: {
    fromDomain: jest.fn(() => asDto),
  },
}));
import { CourseDto } from "src/application/dtos/course.dto";

describe("CreateCourseUseCase", () => {
  let useCase: CreateCourseUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateCourseUseCase(
      mockCourseRepository as any,
      mockPublishService as any,
      mockLogger as any,
      mockTracer as any
    );
  });

  it("should return dto for existing idempotency key (AAA)", async () => {
    // Arrange
    mockCourseRepository.findByIdempotencyKey.mockResolvedValue(fakeCourseInstance);

    // Act
    const result = await useCase.execute(validPayload as any, "idem-1");

    // Assert
    expect(mockTracer.startActiveSpan).toHaveBeenCalled();
    expect(mockCourseRepository.findByIdempotencyKey).toHaveBeenCalledWith("idem-1");
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("idempotency.duplicate", true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Course creation deduplicated by idempotencyKey: idem-1 in CreateCourseUseCase`
    );
    expect(CourseDto.fromDomain).toHaveBeenCalledWith(fakeCourseInstance);
    expect(result).toBe(asDto);
  });

  it("should throw if course slug exists (AAA)", async () => {
    // Arrange
    mockCourseRepository.findByIdempotencyKey.mockResolvedValue(undefined);
    mockCourseRepository.findBySlug.mockResolvedValue({
      getTitle: () => "Awesome Course",
    });

    // Act & Assert
    await expect(
      useCase.execute(validPayload as any, "idem-2")
    ).rejects.toThrow(CourseAlreadyExistException);

    expect(mockCourseRepository.findBySlug).toHaveBeenCalledWith("awesome-course");
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("course.title.already_exist", true);
  });

  it("should create a new course and publish event (AAA)", async () => {
    // Arrange
    mockCourseRepository.findByIdempotencyKey.mockResolvedValue(undefined);
    mockCourseRepository.findBySlug.mockResolvedValue(undefined);
    mockCourseRepository.save.mockResolvedValue(undefined);
    mockPublishService.sendMessage.mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute(validPayload as any, "idem-3");

    // Assert
    expect(mockCourseRepository.findByIdempotencyKey).toHaveBeenCalledWith("idem-3");
    expect(mockCourseRepository.findBySlug).toHaveBeenCalledWith("awesome-course");
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("course.title.already_exist", false);
    expect(mockCourseRepository.save).toHaveBeenCalled();
    expect(mockPublishService.sendMessage).toHaveBeenCalledWith(
      KafkaTopics.CourseCreated,
      expect.objectContaining({
        eventType: "CourseCreatedEvent",
        courseId: "fake-uuid",
        title: "Awesome Course",
        slug: "awesome-course",
        instructorId: "inst-1",
        status: "draft",
        createdAt: expect.any(String),
      })
    );
    expect(result).toBe(asDto);
  });
});

