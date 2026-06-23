import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GenerateCertificateUseCase } from "./impls/generate-certificate.use-case";
import { GetCertificateUseCase } from "./impls/get-certificate.use-case";
import { GetCertificateByEnrollmentUseCase } from "./impls/get-certificate-by-enrollment.use-case";
import { DownloadCertificateUseCase } from "./impls/download-certificate.use-case";
import { GetCertificatesByUserUseCase } from "./impls/get-certificates-by-user.use-case";
import { ServicesModule } from "src/infrastructure/services/services.module";
import { IGenerateCertificateUseCase } from "./interfaces/generate-certificate.interface";
import { IDownloadCertificateUseCase } from "./interfaces/download-certificate.interface";
import { IGetCertificatesByUserUseCase } from "./interfaces/get-certificates-by-user.interface";
import { IGetCertificateUseCase } from "./interfaces/get-certificate.interface";
import { IGetCertificateByEnrollmentUseCase } from "./interfaces/get-certificate-by-enrollment.interface";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule, ServicesModule],
  providers: [
    {
      provide: IGenerateCertificateUseCase,
      useClass: GenerateCertificateUseCase,
    },
    {
      provide: IDownloadCertificateUseCase,
      useClass: DownloadCertificateUseCase,
    },
    {
      provide: IGetCertificatesByUserUseCase,
      useClass: GetCertificatesByUserUseCase,
    },
    { provide: IGetCertificateUseCase, useClass: GetCertificateUseCase },
    {
      provide: IGetCertificateByEnrollmentUseCase,
      useClass: GetCertificateByEnrollmentUseCase,
    },
  ],
  exports: [
    IGenerateCertificateUseCase,
    IDownloadCertificateUseCase,
    IGetCertificatesByUserUseCase,
    IGetCertificateUseCase,
    IGetCertificateByEnrollmentUseCase,
  ],
})
export class CertificateModule {}
