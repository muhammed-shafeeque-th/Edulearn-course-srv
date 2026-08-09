import { Certificate } from "@/domain/entities/certificate.entity";

export abstract class IGetCertificateByEnrollmentUseCase {
  abstract execute(
    enrollmentId: string,
    userId: string,
  ): Promise<Certificate>;
}
