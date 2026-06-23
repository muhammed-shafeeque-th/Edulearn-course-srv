import { Injectable } from "@nestjs/common";
import { ICertificateRepository } from "../../../../domain/repositories/certificate.repository";
import { CertificateDto } from "src/application/dtos/certificate.dto";
import { GetCertificatesByUserRequest } from "src/infrastructure/grpc/generated/course/types/certificate";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetCertificatesByUserUseCase } from "../interfaces/get-certificates-by-user.interface";

@Injectable()
export class GetCertificatesByUserUseCase
  implements IGetCertificatesByUserUseCase
{
  constructor(
    private readonly _certificateRepo: ICertificateRepository,
    private readonly _logger: ILoggerService,
  ) {}

  async execute(
    dto: GetCertificatesByUserRequest,
  ): Promise<{ certificates: CertificateDto[]; total: number }> {
    const { pagination, userId } = dto;

    // Default pagination handling
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const pageSize =
      pagination?.pageSize && pagination.pageSize > 0
        ? pagination.pageSize
        : 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    this._logger.debug(
      `Fetching certificates for userId: ${userId} with offset: ${offset}, limit: ${limit}`,
    );

    try {
      const { data: certificates, total } =
        await this._certificateRepo.findByUserId(userId, offset, limit);

      return {
        certificates: certificates.map((cert) =>
          CertificateDto.fromDomain(cert),
        ),
        total,
      };
    } catch (error: any) {
      this._logger.error(
        `Error fetching certificates for userId: ${userId} - ${error.message}`,
        { error },
      );
      throw error;
    }
  }
}
