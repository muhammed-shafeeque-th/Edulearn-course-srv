import { Certificate } from "@/domain/entities/certificate.entity";

export abstract class IGetCertificateUseCase {
  abstract execute(
    certificateId: string,
    userId: string,
  ): Promise<Certificate>;
}
