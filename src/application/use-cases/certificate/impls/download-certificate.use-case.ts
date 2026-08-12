import { Injectable } from "@nestjs/common";
import { ICertificateRepository } from "../../../../domain/repositories/certificate.repository";
import { ICertificatePDFGenerator } from "src/application/adaptors/pdf-certificate-generator.adapter";
import { Readable } from "node:stream";
import { CertificateNotFoundException } from "src/domain/exceptions/certificate.exceptions";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IDownloadCertificateUseCase } from "../interfaces/download-certificate.interface";

@Injectable()
export class DownloadCertificateUseCase implements IDownloadCertificateUseCase {
  constructor(
    private readonly _certificateRepo: ICertificateRepository,
    private readonly _certificatePdfGenerator: ICertificatePDFGenerator,
    private readonly _logger: ILoggerService,
  ) {}

  /**
   * Download a certificate as a PDF stream.
   * @param certificateId string - The certificate's unique identifier
   * @param userId string - The requesting user's ID
   * @returns Readable - PDF stream
   * @throws NotFoundException - If certificate not found
   * @throws ForbiddenException - If user does not own certificate
   */
  async execute(certificateId: string, userId: string): Promise<Readable> {
    this._logger.debug(
      `Attempting to download certificate ${certificateId} for user ${userId}`,
    );

    // Retrieve certificate
    const certificate = await this._certificateRepo.findById(certificateId);

    if (!certificate) {
      this._logger.warn(`Certificate with ID ${certificateId} not found`);
      throw new CertificateNotFoundException("Certificate not found");
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      this._logger.warn(
        `User ${userId} tried to access certificate ${certificateId} owned by user ${certificate.getUserId()}`,
      );
      throw new UnauthorizedException("Not authorized");
    }

    try {
      const pdfStream =
        await this._certificatePdfGenerator.generate(certificate);
      this._logger.debug(
        `Successfully generated PDF for certificate ${certificateId}`,
      );
      return pdfStream;
    } catch (error: any) {
      this._logger.error(
        `Failed to generate PDF for certificate ${certificateId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
