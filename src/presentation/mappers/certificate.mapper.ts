import { Certificate } from "src/domain/entities/certificate.entity";
import { CertificateData } from "src/infrastructure/grpc/generated/course/types/certificate";

export class CertificateMapper {
  /**
   * Converts this CertificateDto instance into a gRPC CertificateData object.
   */
  static toGrpcResponse(certificate: Certificate): CertificateData {
    return {
      id: certificate.getId(),
      enrollmentId: certificate.getEnrollmentId(),
      userId: certificate.getUserId(),
      courseId: certificate.getCourseId(),
      courseTitle: certificate.getCourseTitle(),
      studentName: certificate.getStudentName(),
      completedAt: certificate.getCompletedAt().toISOString(),
      certificateNumber: certificate.getCertificateNumber(),
      issueDate: certificate.getIssueDate()?.toISOString(),
      createdAt: certificate.getCreatedAt().toISOString(),
      updatedAt: certificate.getUpdatedAt()?.toISOString(),
    };
  }
}
