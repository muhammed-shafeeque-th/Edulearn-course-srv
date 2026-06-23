import { CertificateDto } from "src/application/dtos/certificate.dto";

export abstract class IGetCertificateUseCase {
  abstract execute(
    certificateId: string,
    userId: string,
  ): Promise<CertificateDto>;
}
