import {
  Injectable,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { IEnrollmentRepository } from "../../../domain/repositories/enrollment.repository";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { Certificate } from "../../../domain/entities/certificate.entity";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { BadRequestException, CertificateNotFoundException, NotAuthorizedException } from "src/domain/exceptions/domain.exceptions";

export interface GenerateCertificateRequest {
  enrollmentId: string;
  userId: string;
  studentName: string;
}

@Injectable()
export class GenerateCertificateUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly certificateRepo: ICertificateRepository
  ) {}

  async execute(request: GenerateCertificateRequest): Promise<CertificateDto> {
    //  Validate enrollment exists and belongs to user
    const enrollment = await this.enrollmentRepo.getById(
      request.enrollmentId,
      { includeCourse: true }
    );

    let course = enrollment.getCourse();

    if (!enrollment) {
      throw new CertificateNotFoundException("Enrollment not found");
    }

    if (enrollment.getStudentId() !== request.userId) {
      throw new NotAuthorizedException("Not authorized");
    }

    //  Check if enrollment is completed
    if (
      enrollment.getStatus() !== "COMPLETED" &&
      enrollment.getProgressPercent() !== 100
    ) {
      throw new BadRequestException(
        "Course must be completed to generate certificate"
      );
    }

    //  Check if certificate already exists
    const existingCertificate = await this.certificateRepo.findByEnrollmentId(
      request.enrollmentId
    );

    if (existingCertificate) {
      // date student name if changed
      if (existingCertificate.getStudentName() !== request.studentName.trim()) {
        existingCertificate.updateStudentName(request.studentName);
        await this.certificateRepo.save(existingCertificate);
      }

      return CertificateDto.fromDomain(existingCertificate);
    }

    //  Validate student name
    const trimmedName = request.studentName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new BadRequestException(
        "Student name must be at least 2 characters"
      );
    }

    if (trimmedName.length > 100) {
      throw new BadRequestException(
        "Student name must be less than 100 characters"
      );
    }

    //  Generate certificate
    const certificateId = uuidv4();
    const certificateNumber = Certificate.generateCertificateNumber();
    const issueDate = new Date();

    const certificate = new Certificate(
      certificateId,
      enrollment.getId(),
      enrollment.getStudentId(),
      enrollment.getCourseId(),
      course.getTitle() || "Course Title",
      trimmedName,
      enrollment.getCompletedAt() || new Date(),
      certificateNumber,
      issueDate
    );

    //  Save certificate
    await this.certificateRepo.save(certificate);

    return CertificateDto.fromDomain(certificate);
  }
}
