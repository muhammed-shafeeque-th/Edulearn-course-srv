import {
  Injectable,
} from "@nestjs/common";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { CertificateNotFoundException, NotAuthorizedException } from "src/domain/exceptions/domain.exceptions";

@Injectable()
export class GetCertificateByEnrollmentUseCase {
  constructor(private readonly certificateRepo: ICertificateRepository) {}

  async execute(enrollmentId: string, userId: string): Promise<CertificateDto> {
    const certificate =
      await this.certificateRepo.findByEnrollmentId(enrollmentId);

    if (!certificate) {
      throw new CertificateNotFoundException(
        `Notification not found with enrollmentId ${enrollmentId}`
      );
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      throw new NotAuthorizedException("Not authorized");
    }

    return CertificateDto.fromDomain(certificate);
  }
}
