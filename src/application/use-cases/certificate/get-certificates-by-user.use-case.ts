import { Injectable } from "@nestjs/common";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { GetCertificatesByUserRequest } from "src/infrastructure/grpc/generated/course/types/certificate";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";

@Injectable()
export class GetCertificatesByUserUseCase {
  constructor(private readonly certificateRepo: ICertificateRepository,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Retrieves certificates by user with pagination support.
   * @param dto - The request object containing userId and pagination.
   * @returns An object with the list of CertificateDto and the total count.
   */
  async execute(
    dto: GetCertificatesByUserRequest
  ): Promise<{ certificates: CertificateDto[]; total: number }> {
    const { pagination, userId } = dto;

    // Default pagination handling
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const pageSize = pagination?.pageSize && pagination.pageSize > 0 ? pagination.pageSize : 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    this.logger.debug(
      `Fetching certificates for userId: ${userId} with offset: ${offset}, limit: ${limit}`
    );

    try {
      const { certificates, total } = await this.certificateRepo.findByUserId(
        userId,
        offset,
        limit
      );

      return {
        certificates: certificates.map((cert) => CertificateDto.fromDomain(cert)),
        total,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching certificates for userId: ${userId} - ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
