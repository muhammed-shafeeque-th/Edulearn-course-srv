import { Certificate } from "../entities/certificate.entity";

export abstract class ICertificateRepository {
  abstract save(certificate: Certificate): Promise<void>;
  abstract findById(id: string): Promise<Certificate | null>;
  abstract findByEnrollmentId(
    enrollmentId: string
  ): Promise<Certificate | null>;
  abstract findByCertificateNumber(
    certificateNumber: string
  ): Promise<Certificate | null>;
  abstract findByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<{ certificates: Certificate[]; total: number }>;
}
