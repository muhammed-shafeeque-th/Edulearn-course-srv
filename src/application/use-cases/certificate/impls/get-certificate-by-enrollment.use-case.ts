import { Injectable } from "@nestjs/common";
import { ICertificateRepository } from "../../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { CertificateNotFoundException } from "src/domain/exceptions/certificate.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IGetCertificateByEnrollmentUseCase } from "../interfaces/get-certificate-by-enrollment.interface";

@Injectable()
export class GetCertificateByEnrollmentUseCase implements IGetCertificateByEnrollmentUseCase {
  constructor(private readonly _certificateRepo: ICertificateRepository) {}

  async execute(enrollmentId: string, userId: string): Promise<CertificateDto> {
    const certificate =
      await this._certificateRepo.findByEnrollmentId(enrollmentId);

    if (!certificate) {
      throw new CertificateNotFoundException(
        `Notification not found with enrollmentId ${enrollmentId}`,
      );
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      throw new UnauthorizedException("Not authorized");
    }

    return CertificateDto.fromDomain(certificate);
  }
}
