import { User } from "src/domain/entities/user.entity";
import { UserOrmEntity } from "../entities/user.entity";
import { Certificate } from "src/domain/entities/certificate.entity";
import { CertificateOrmEntity } from "../entities/certificate-orm.entity";

/**
 * EntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class CertificateEntityMapper {
  
  // -------- Certificate -----------

  static toOrmCertificate(certificate: Certificate): CertificateOrmEntity {
    const orm = new CertificateOrmEntity();
    orm.id = certificate.getId();
    orm.enrollmentId = certificate.getEnrollmentId();
    orm.userId = certificate.getUserId();
    orm.courseId = certificate.getCourseId();
    orm.courseTitle = certificate.getCourseTitle();
    orm.studentName = certificate.getStudentName();
    orm.completedAt = certificate.getCompletedAt();
    orm.certificateNumber = certificate.getCertificateNumber();
    orm.issueDate = certificate.getIssueDate();
    orm.createdAt = certificate.getCreatedAt();
    orm.updatedAt = certificate.getUpdatedAt();
    return orm;
  }

  static toDomainCertificate(orm: CertificateOrmEntity): Certificate {
    return new Certificate(
      orm.id,
      orm.enrollmentId,
      orm.userId,
      orm.courseId,
      orm.courseTitle,
      orm.studentName,
      orm.completedAt,
      orm.certificateNumber,
      orm.issueDate,
      orm.createdAt,
      orm.updatedAt
    );
  }

  
}
