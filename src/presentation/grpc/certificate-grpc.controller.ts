import { Controller } from "@nestjs/common";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { GetCertificateUseCase } from "src/application/use-cases/certificate/get-certificate.use-case";
import { GetCertificateByEnrollmentUseCase } from "src/application/use-cases/certificate/get-certificate-by-enrollment.use-case";
import { GenerateCertificateUseCase } from "src/application/use-cases/certificate/generate-certificate.use-case";
import {
  CertificatePDFChunk,
  CertificateResponse,
  CertificatesResponse,
  DownloadCertificateRequest,
  GenerateCertificateRequest,
  GetCertificateByEnrollmentRequest,
  GetCertificateRequest,
  GetCertificatesByUserRequest,
} from "src/infrastructure/grpc/generated/course/types/certificate";
import { Observable } from "rxjs";
import { GetCertificatesByUserUseCase } from "src/application/use-cases/certificate/get-certificates-by-user.use-case";
import { DownloadCertificateUseCase } from "src/application/use-cases/certificate/download-certificate.use-case";
import { Readable } from "node:stream";

@Controller()
export class CertificateGrpcController {
  constructor(
    private readonly getCertificateUseCase: GetCertificateUseCase,
    private readonly generateCertificateUseCase: GenerateCertificateUseCase,
    private readonly getCertificateByEnrollmentUseCase: GetCertificateByEnrollmentUseCase,
    private readonly getCertificatesByUserUseCase: GetCertificatesByUserUseCase,
    private readonly downloadCertificateUseCase: DownloadCertificateUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:
        "serializeError" in error && typeof error.serializeError === "function"
          ? error.serializeError()
          : [{ message: error.message }],
    };
  }

  @GrpcMethod("EnrollmentService", "GetCertificate")
  async getCertificate(
    data: GetCertificateRequest,
    metadata: Metadata
  ): Promise<CertificateResponse> {
    this.logger.debug(
      `[GetCertificate] Called with certificateId=${data.certificateId}, userId=${data.userId}`,
      { data }
    );
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificate",
        async (span) => {
          span.setAttribute("certificate.id", data.certificateId);

          const certificateDto = await this.getCertificateUseCase.execute(
            data.certificateId,
            data.userId
          );
          this.logger.debug(
            `[GetCertificate] Certificate fetched successfully, certificateId=${data.certificateId}`
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`[GetCertificate] Failed to get certificate: ${error.message}`, {
        error,
        data,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetCertificatesByUser")
  async getCertificatesByUser(
    data: GetCertificatesByUserRequest,
    metadata: Metadata
  ): Promise<CertificatesResponse> {
    this.logger.debug(
      `[GetCertificatesByUser] Called with userId=${data.userId}`,
      { data }
    );
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificatesByUser",
        async (span) => {
          span.setAttribute("user.id", data.userId);

          const { certificates, total } =
            await this.getCertificatesByUserUseCase.execute(data);

          this.logger.debug(
            `[GetCertificatesByUser] Certificates fetched successfully for userId=${data.userId}, total=${total}`
          );
          return {
            certificates: {
              certificates: certificates.map((certificate) =>
                certificate.toGrpcResponse()
              ),
              total,
            },
          };
        }
      );
    } catch (error) {
      this.logger.error(`[GetCertificatesByUser] Failed to get certificates: ${error.message}`, {
        error,
        data,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcStreamMethod("CertificateService", "DownloadCertificate")
  async downloadCertificate(
    data: DownloadCertificateRequest
  ): Promise<Observable<CertificatePDFChunk>> {
    this.logger.debug(
      `[DownloadCertificate] Called with certificateId=${data.certificateId}, userId=${data.userId}`,
      { data }
    );
    // Generate PDF stream
    let pdfStream: Readable;
    try {
      pdfStream = await this.downloadCertificateUseCase.execute(
        data.certificateId,
        data.userId
      );
      this.logger.debug(
        `[DownloadCertificate] PDF stream created for certificateId=${data.certificateId}`
      );
    } catch (error) {
      this.logger.error(
        `[DownloadCertificate] Failed to create PDF stream: ${error.message}`,
        { error, data }
      );
      throw error;
    }

    // Convert Node.js stream to gRPC stream (Observable)
    return new Observable((observer) => {
      pdfStream.on("data", (chunk: Buffer) => {
        this.logger.debug(
          `[DownloadCertificate] Streaming data chunk for certificateId=${data.certificateId}. Chunk size: ${chunk.length} bytes`
        );
        observer.next({ data: chunk });
      });

      pdfStream.on("end", () => {
        observer.complete();
      });

      pdfStream.on("error", (error) => {
        this.logger.error(
          `[DownloadCertificate] PDF stream error for certificateId=${data.certificateId}: ${error.message}`,
          { error }
        );
        observer.error(error);
      });
    });
  }

  @GrpcMethod("EnrollmentService", "GetCertificateByEnrollment")
  async getCertificateByEnrollment(
    data: GetCertificateByEnrollmentRequest,
    metadata: Metadata
  ): Promise<CertificateResponse> {
    this.logger.debug(
      `[GetCertificateByEnrollment] Called with enrollmentId=${data.enrollmentId}, userId=${data.userId}`,
      { data }
    );
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificateByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const certificateDto =
            await this.getCertificateByEnrollmentUseCase.execute(
              data.enrollmentId,
              data.userId
            );
            
          this.logger.debug(
            `[GetCertificateByEnrollment] Certificate fetched successfully for enrollmentId=${data.enrollmentId}`
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`[GetCertificateByEnrollment] Failed to get certificate: ${error.message}`, {
        error,
        data,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GenerateCertificate")
  async generateCertificate(
    data: GenerateCertificateRequest,
    metadata: Metadata
  ): Promise<CertificateResponse> {
    this.logger.debug(
      `[GenerateCertificate] Called with enrollmentId=${data.enrollmentId}, userId=${data.userId}, studentName="${data.studentName}"`,
      { data }
    );
    try {
      return await this.tracer.startActiveSpan(
        "EnrollmentGrpcController.GenerateCertificate",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const certificateDto =
            await this.generateCertificateUseCase.execute(data);

          this.logger.debug(
            `[GenerateCertificate] Certificate generated successfully for enrollmentId=${data.enrollmentId}, userId=${data.userId}, certificateId=${certificateDto?.id}`
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`[GenerateCertificate] Failed to generate certificate: ${error.message}`, {
        error,
        data,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
}
