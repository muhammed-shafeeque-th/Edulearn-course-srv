import { UserDomainException } from "../exceptions/domain.exceptions";

export class Certificate {
  constructor(
    private readonly id: string,
    private readonly enrollmentId: string,
    private readonly userId: string,
    private readonly courseId: string,
    private readonly courseTitle: string,
    private studentName: string,
    private readonly completedAt: Date,
    private readonly certificateNumber: string,
    private readonly issueDate: Date,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string {
    return this.id;
  }

  getEnrollmentId(): string {
    return this.enrollmentId;
  }

  getUserId(): string {
    return this.userId;
  }

  getCourseId(): string {
    return this.courseId;
  }

  getCourseTitle(): string {
    return this.courseTitle;
  }

  getStudentName(): string {
    return this.studentName;
  }

  getCompletedAt(): Date {
    return this.completedAt;
  }

  getCertificateNumber(): string {
    return this.certificateNumber;
  }

  getIssueDate(): Date {
    return this.issueDate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic
  updateStudentName(newName: string): void {
    if (!newName || newName.trim().length < 2) {
      throw new UserDomainException("Student name must be at least 2 characters");
    }

    if (newName.length > 100) {
      throw new UserDomainException("Student name must be less than 100 characters");
    }

    this.studentName = newName.trim();
    this.updatedAt = new Date();
  }

  static generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `CERT-${timestamp}-${random}`.toUpperCase();
  }
}
