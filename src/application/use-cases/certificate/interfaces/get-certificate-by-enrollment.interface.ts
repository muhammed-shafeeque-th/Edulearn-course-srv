import { CertificateDto } from "src/application/dtos/certificate.dto";

export abstract class IGetCertificateByEnrollmentUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<CertificateDto>;
}
