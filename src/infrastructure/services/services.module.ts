import { Module } from "@nestjs/common";
import { ICertificatePDFGenerator } from "src/application/services/pdf-certificate-generator.adapter";
import { CertificatePDFGeneratorImpl } from "./pdf-service";

@Module({
  providers: [
    {
      provide: ICertificatePDFGenerator,
      useClass: CertificatePDFGeneratorImpl,
    },
  ],
  exports: [ICertificatePDFGenerator],
})
export class ServicesModule {}
