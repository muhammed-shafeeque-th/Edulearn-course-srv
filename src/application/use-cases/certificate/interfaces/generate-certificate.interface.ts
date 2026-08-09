import { Certificate } from "@/domain/entities/certificate.entity";

export interface GenerateCertificateRequest {
  enrollmentId: string;
  userId: string;
  studentName: string;
}

export abstract class IGenerateCertificateUseCase {
  abstract execute(
    request: GenerateCertificateRequest,
  ): Promise<Certificate>;
}
