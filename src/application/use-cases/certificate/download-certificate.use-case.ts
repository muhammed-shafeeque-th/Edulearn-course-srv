import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { ICertificatePDFGenerator } from "src/application/services/pdf-certificate-generator.adapter";
import { Readable } from "node:stream";

@Injectable()
export class DownloadCertificateUseCase {
  constructor(
    private readonly certificateRepo: ICertificateRepository,
    private readonly certificatePdfGenerator: ICertificatePDFGenerator,
    private readonly logger: LoggingService
  ) {}

  /**
   * Download a certificate as a PDF stream.
   * @param certificateId string - The certificate's unique identifier
   * @param userId string - The requesting user's ID
   * @returns Readable - PDF stream
   * @throws NotFoundException - If certificate not found
   * @throws ForbiddenException - If user does not own certificate
   */
  async execute(
    certificateId: string,
    userId: string,
  ): Promise<Readable> {
    this.logger.debug(`Attempting to download certificate ${certificateId} for user ${userId}`);

    // Retrieve certificate
    const certificate = await this.certificateRepo.findById(certificateId);

    if (!certificate) {
      this.logger.warn(`Certificate with ID ${certificateId} not found`);
      throw new NotFoundException("Certificate not found");
    }

    // Verify ownership
    if (certificate.getUserId() !== userId) {
      this.logger.warn(`User ${userId} tried to access certificate ${certificateId} owned by user ${certificate.getUserId()}`);
      throw new ForbiddenException("Not authorized");
    }

    try {
      const pdfStream = await this.certificatePdfGenerator.generate(certificate);
      this.logger.log(`Successfully generated PDF for certificate ${certificateId}`);
      return pdfStream;
    } catch (error) {
      this.logger.error(`Failed to generate PDF for certificate ${certificateId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
