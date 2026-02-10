import { Certificate } from "src/domain/entities/certificate.entity";
import { CertificateData } from "src/infrastructure/grpc/generated/course/types/certificate";

export class CertificateDto {
  id: string;
  enrollmentId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  completedAt: Date;
  certificateNumber: string;
  issueDate: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(certificate: Certificate): CertificateDto {
    const dto = new CertificateDto();
    dto.id = certificate.getId();
    dto.enrollmentId = certificate.getEnrollmentId();
    dto.userId = certificate.getUserId();
    dto.courseId = certificate.getCourseId();
    dto.courseTitle = certificate.getCourseTitle();
    dto.studentName = certificate.getStudentName();
    dto.completedAt = certificate.getCompletedAt();
    dto.certificateNumber = certificate.getCertificateNumber();
    dto.issueDate = certificate.getIssueDate();
    dto.createdAt = certificate.getCreatedAt();
    dto.updatedAt = certificate.getUpdatedAt();
    return dto;
  }

  /**
   * Converts this CertificateDto instance into a gRPC CertificateData object.
   */
  toGrpcResponse(): CertificateData {
    return {
      id: this.id,
      certificateNumber: this.certificateNumber,
      completedAt: this.completedAt.toISOString(),
      courseId: this.courseId,
      courseTitle: this.courseTitle,
      createdAt: this.createdAt.toISOString(),
      enrollmentId: this.enrollmentId,
      issueDate: this.issueDate.toISOString(),
      studentName: this.studentName,
      updatedAt: this.updatedAt.toISOString(),
      userId: this.userId,
    };
  }
}
