import { Controller, UseFilters } from "@nestjs/common";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { DomainException } from "src/domain/exceptions/domain.exception";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { Metadata } from "@grpc/grpc-js";
import { IGetCertificateUseCase } from "src/application/use-cases/certificate/interfaces/get-certificate.interface";
import { IGetCertificateByEnrollmentUseCase } from "src/application/use-cases/certificate/interfaces/get-certificate-by-enrollment.interface";
import { IGenerateCertificateUseCase } from "src/application/use-cases/certificate/interfaces/generate-certificate.interface";
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
import { IGetCertificatesByUserUseCase } from "src/application/use-cases/certificate/interfaces/get-certificates-by-user.interface";
import { IDownloadCertificateUseCase } from "src/application/use-cases/certificate/interfaces/download-certificate.interface";
import { Readable } from "node:stream";
import { GrpcExceptionFilter } from "src/infrastructure/filters/grpc-exception.filter";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
@UseFilters(GrpcExceptionFilter)
export class CertificateGrpcController {
  constructor(
    private readonly _getCertificateUseCase: IGetCertificateUseCase,
    private readonly _generateCertificateUseCase: IGenerateCertificateUseCase,
    private readonly _getCertificateByEnrollmentUseCase: IGetCertificateByEnrollmentUseCase,
    private readonly _getCertificatesByUserUseCase: IGetCertificatesByUserUseCase,
    private readonly _downloadCertificateUseCase: IDownloadCertificateUseCase,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.code,
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
    metadata: Metadata,
  ): Promise<CertificateResponse> {
    this._logger.debug(
      `[GetCertificate] Called with certificateId=${data.certificateId}, userId=${data.userId}`,
      { data },
    );
    try {
      return await this._tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificate",
        async (span) => {
          span.setAttribute("certificate.id", data.certificateId);

          const certificateDto = await this._getCertificateUseCase.execute(
            data.certificateId,
            data.userId,
          );
          this._logger.debug(
            `[GetCertificate] Certificate fetched successfully, certificateId=${data.certificateId}`,
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `[GetCertificate] Failed to get certificate: ${error.message}`,
        {
          error,
          data,
        },
      );

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GetCertificatesByUser")
  async getCertificatesByUser(
    data: GetCertificatesByUserRequest,
    metadata: Metadata,
  ): Promise<CertificatesResponse> {
    this._logger.debug(
      `[GetCertificatesByUser] Called with userId=${data.userId}`,
      { data },
    );
    try {
      return await this._tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificatesByUser",
        async (span) => {
          span.setAttribute("user.id", data.userId);

          const { certificates, total } =
            await this._getCertificatesByUserUseCase.execute(data);

          this._logger.debug(
            `[GetCertificatesByUser] Certificates fetched successfully for userId=${data.userId}, total=${total}`,
          );
          return {
            certificates: {
              certificates: certificates.map((certificate) =>
                certificate.toGrpcResponse(),
              ),
              total,
            },
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `[GetCertificatesByUser] Failed to get certificates: ${error.message}`,
        {
          error,
          data,
        },
      );

      throw error;
    }
  }

  @GrpcStreamMethod("CertificateService", "DownloadCertificate")
  async downloadCertificate(
    data: DownloadCertificateRequest,
  ): Promise<Observable<CertificatePDFChunk>> {
    this._logger.debug(
      `[DownloadCertificate] Called with certificateId=${data.certificateId}, userId=${data.userId}`,
      { data },
    );
    // Generate PDF stream
    let pdfStream: Readable;
    try {
      pdfStream = await this._downloadCertificateUseCase.execute(
        data.certificateId,
        data.userId,
      );
      this._logger.debug(
        `[DownloadCertificate] PDF stream created for certificateId=${data.certificateId}`,
      );
    } catch (error: any) {
      this._logger.error(
        `[DownloadCertificate] Failed to create PDF stream: ${error.message}`,
        { error, data },
      );
      throw error;
    }

    // Convert Node.js stream to gRPC stream (Observable)
    return new Observable((observer) => {
      pdfStream.on("data", (chunk: Buffer) => {
        this._logger.debug(
          `[DownloadCertificate] Streaming data chunk for certificateId=${data.certificateId}. Chunk size: ${chunk.length} bytes`,
        );
        observer.next({ data: chunk });
      });

      pdfStream.on("end", () => {
        observer.complete();
      });

      pdfStream.on("error", (error) => {
        this._logger.error(
          `[DownloadCertificate] PDF stream error for certificateId=${data.certificateId}: ${error.message}`,
          { error },
        );
        observer.error(error);
      });
    });
  }

  @GrpcMethod("EnrollmentService", "GetCertificateByEnrollment")
  async getCertificateByEnrollment(
    data: GetCertificateByEnrollmentRequest,
    metadata: Metadata,
  ): Promise<CertificateResponse> {
    this._logger.debug(
      `[GetCertificateByEnrollment] Called with enrollmentId=${data.enrollmentId}, userId=${data.userId}`,
      { data },
    );
    try {
      return await this._tracer.startActiveSpan(
        "EnrollmentGrpcController.GetCertificateByEnrollment",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const certificateDto =
            await this._getCertificateByEnrollmentUseCase.execute(
              data.enrollmentId,
              data.userId,
            );

          this._logger.debug(
            `[GetCertificateByEnrollment] Certificate fetched successfully for enrollmentId=${data.enrollmentId}`,
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `[GetCertificateByEnrollment] Failed to get certificate: ${error.message}`,
        {
          error,
          data,
        },
      );

      throw error;
    }
  }

  @GrpcMethod("EnrollmentService", "GenerateCertificate")
  async generateCertificate(
    data: GenerateCertificateRequest,
    metadata: Metadata,
  ): Promise<CertificateResponse> {
    this._logger.debug(
      `[GenerateCertificate] Called with enrollmentId=${data.enrollmentId}, userId=${data.userId}, studentName="${data.studentName}"`,
      { data },
    );
    try {
      return await this._tracer.startActiveSpan(
        "EnrollmentGrpcController.GenerateCertificate",
        async (span) => {
          span.setAttribute("enrollment.id", data.enrollmentId);

          const certificateDto =
            await this._generateCertificateUseCase.execute(data);

          this._logger.debug(
            `[GenerateCertificate] Certificate generated successfully for enrollmentId=${data.enrollmentId}, userId=${data.userId}, certificateId=${certificateDto?.id}`,
          );
          return {
            certificate: certificateDto.toGrpcResponse(),
          };
        },
      );
    } catch (error: any) {
      this._logger.error(
        `[GenerateCertificate] Failed to generate certificate: ${error.message}`,
        {
          error,
          data,
        },
      );

      throw error;
    }
  }
}
