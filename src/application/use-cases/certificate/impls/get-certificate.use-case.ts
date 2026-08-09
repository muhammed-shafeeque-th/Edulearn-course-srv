import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ICertificateRepository } from "../../../../domain/repositories/certificate.repository";
import { Certificate } from "@/domain/entities/certificate.entity";
import { CertificateNotFoundException } from "src/domain/exceptions/certificate.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IGetCertificateUseCase } from "../interfaces/get-certificate.interface";

@Injectable()
export class GetCertificateUseCase implements IGetCertificateUseCase {
  constructor(private readonly _certificateRepo: ICertificateRepository) {}

  async execute(
    certificateId: string,
    userId: string,
  ): Promise<Certificate> {
    const certificate = await this._certificateRepo.findById(certificateId);

    if (!certificate) {
      throw new CertificateNotFoundException("Certificate not found");
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      throw new UnauthorizedException("Not authorized");
    }

    return certificate;
  }
}
