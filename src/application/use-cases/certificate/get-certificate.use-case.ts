import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { CertificateNotFoundException, NotAuthorizedException } from "src/domain/exceptions/domain.exceptions";

@Injectable()
export class GetCertificateUseCase {
  constructor(private readonly certificateRepo: ICertificateRepository) {}

  async execute(
    certificateId: string,
    userId: string
  ): Promise<CertificateDto> {
    const certificate = await this.certificateRepo.findById(certificateId);

    if (!certificate) {
      throw new CertificateNotFoundException("Certificate not found");
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      throw new NotAuthorizedException("Not authorized");
    }

    return CertificateDto.fromDomain(certificate);
  }
}
