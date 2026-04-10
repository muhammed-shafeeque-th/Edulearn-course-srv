import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import {
  CertificateNotFoundException,
} from "src/domain/exceptions/certificate.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";

@Injectable()
export class GetCertificateUseCase {
  constructor(private readonly certificateRepo: ICertificateRepository) {}

  async execute(
    certificateId: string,
    userId: string,
  ): Promise<CertificateDto> {
    const certificate = await this.certificateRepo.findById(certificateId);

    if (!certificate) {
      throw new CertificateNotFoundException("Certificate not found");
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      throw new UnauthorizedException("Not authorized");
    }

    return CertificateDto.fromDomain(certificate);
  }
}
