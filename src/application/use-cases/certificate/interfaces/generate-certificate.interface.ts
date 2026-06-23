import { CertificateDto } from "src/application/dtos/certificate.dto";

export interface GenerateCertificateRequest {
  enrollmentId: string;
  userId: string;
  studentName: string;
}

export abstract class IGenerateCertificateUseCase {
  abstract execute(
    request: GenerateCertificateRequest,
  ): Promise<CertificateDto>;
}
