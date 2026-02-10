import { Module } from "@nestjs/common";
import { DatabaseRepositoryModule } from "src/infrastructure/database/database-repository.module";
import { RedisModule } from "src/infrastructure/redis/redis.module";
import { KafkaModule } from "src/infrastructure/kafka/kafka.module";
import { GenerateCertificateUseCase } from "./generate-certificate.use-case";
import { GetCertificateUseCase } from "./get-certificate.use-case";
import { GetCertificateByEnrollmentUseCase } from "./get-certificate-by-enrollment.use-case";
import { DownloadCertificateUseCase } from "./download-certificate.use-case";
import { GetCertificatesByUserUseCase } from "./get-certificates-by-user.use-case";
import { ServicesModule } from "src/infrastructure/services/services.module";

@Module({
  imports: [DatabaseRepositoryModule, RedisModule, KafkaModule, ServicesModule],
  providers: [
    GenerateCertificateUseCase,
    DownloadCertificateUseCase,
    GetCertificatesByUserUseCase,
    GetCertificateUseCase,
    GetCertificateByEnrollmentUseCase,
  ],
  exports: [
    GenerateCertificateUseCase,
    DownloadCertificateUseCase,
    GetCertificatesByUserUseCase,
    GetCertificateUseCase,
    GetCertificateByEnrollmentUseCase,
  ],
})
export class CertificateModule {}
