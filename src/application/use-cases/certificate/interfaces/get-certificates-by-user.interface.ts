import { Certificate } from "@/domain/entities/certificate.entity";
import { GetCertificatesByUserRequest } from "src/infrastructure/grpc/generated/course/types/certificate";

export abstract class IGetCertificatesByUserUseCase {
  /**
   * Retrieves certificates by user with pagination support.
   * @param dto - The request object containing userId and pagination.
   * @returns An object with the list of CertificateDto and the total count.
   */
  abstract execute(
    dto: GetCertificatesByUserRequest,
  ): Promise<{ certificates: Certificate[]; total: number }>;
}
