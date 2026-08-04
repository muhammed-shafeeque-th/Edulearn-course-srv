import { Certificate } from "../entities/certificate.entity";
import { IBaseRepository, PaginatedResult } from "./base.repository";

export abstract class ICertificateRepository extends IBaseRepository<Certificate> {
  abstract save(certificate: Certificate): Promise<void>;
  abstract findByEnrollmentId(
    enrollmentId: string,
  ): Promise<Certificate | null>;
  abstract findById(id: string): Promise<Certificate | null>;
  abstract findByCertificateNumber(
    certificateNumber: string,
  ): Promise<Certificate | null>;
  abstract findByUserId(
    userId: string,
    offset?: number,
    limit?: number,
  ): Promise<PaginatedResult<Certificate>>;
}
