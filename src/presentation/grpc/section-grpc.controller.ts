import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { CreateSectionUseCase } from "src/application/use-cases/section/create-section.use-case";
import { SectionDto } from "src/application/dtos/section.dto";
import { GetSectionUseCase } from "src/application/use-cases/section/get-section.use-case";
import { UpdateSectionUseCase } from "src/application/use-cases/section/update-section.use-case";
import { DeleteSectionUseCase } from "src/application/use-cases/section/delete-section.use-case";
import { CreateSectionRequestDto } from "./dtos/section/create-section.dto";
import { GetSectionRequestDto } from "./dtos/section/get-section.dto";
import { GetSectionsByCourseUseCase } from "src/application/use-cases/section/get-sections-by-course.use-case";
import { ContentMetaData, LessonData } from "src/infrastructure/grpc/generated/course/types/lesson";
import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { DeleteSectionRequest, DeleteSectionResponse, GetSectionsByCourseRequest, SectionData, SectionResponse, SectionsResponse, UpdateSectionRequest } from "src/infrastructure/grpc/generated/course/types/section";
import { LessonDto } from "src/application/dtos/lesson.dto";
import { DomainException } from "src/domain/exceptions/domain.exceptions";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { Error } from "src/infrastructure/grpc/generated/course/common";
import { getMetadataValues } from "src/shared/utils/get-metadata";
import { Metadata } from "@grpc/grpc-js";
import { DeleteSectionDto } from "./dtos/section/delete-section.dto";

@Controller()
export class SectionGrpcController {
  constructor(
    private readonly createSectionUseCase: CreateSectionUseCase,
    private readonly getSectionUseCase: GetSectionUseCase,
    private readonly getSectionsByCourseUseCase: GetSectionsByCourseUseCase,
    private readonly updateSectionUseCase: UpdateSectionUseCase,
    private readonly deleteSectionUseCase: DeleteSectionUseCase,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  private createErrorResponse(error: DomainException): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details:  "serializeError" in error && typeof error.serializeError === "function"
      ? error.serializeError()
      : [{ message: error.message }],
    };
  }

  @GrpcMethod("CourseService", "CreateSection")
  async createSection(
    data: CreateSectionRequestDto,
    metadata: Metadata
  ): Promise<SectionResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "SectionGrpcController.CreateSection",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(
            `gRPC: Creating section for courseID ${data.courseId}`,
            { ctx: SectionGrpcController.name }
          );
          const { idempotencyKey } = getMetadataValues(metadata, {
            idempotencyKey: "idempotency-key",
          });

          const sectionDto = await this.createSectionUseCase.execute(
            data,
            idempotencyKey
          );
          return {
            section: sectionDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to create section: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetSection")
  async getSection(
    data: GetSectionRequestDto,
    metadata: Metadata
  ): Promise<SectionResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "SectionGrpcController.GetSection",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          span.setAttribute("section.id", data.sectionId);
          this.logger.log(
            `gRPC: Fetching section for courseID ${data.courseId}`,
            { ctx: SectionGrpcController.name }
          );

          const sectionDto = await this.getSectionUseCase.execute(
            data.sectionId
          );

          return {
            section: sectionDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get section: ${error.message}`, {
        error,
      });
      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "UpdateSection")
  async updateSection(
    data: UpdateSectionRequest,
    metadata: Metadata
  ): Promise<SectionResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "SectionGrpcController.UpdateSection",
        async (span) => {
          span.setAttribute("course.section.id", data.sectionId);
          this.logger.log(`gRPC: Updating section  ${data.sectionId}`, {
            ctx: SectionGrpcController.name,
          });

          const sectionDto = await this.updateSectionUseCase.execute(data);

          return {
            section: sectionDto.toGrpcResponse(),
          };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update section: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }

  @GrpcMethod("CourseService", "DeleteSection")
  async deleteSection(
    data: DeleteSectionDto,
    metadata: Metadata
  ): Promise<DeleteSectionResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "SectionGrpcController.DeleteSection",
        async (span) => {
          span.setAttribute("section.id", data.sectionId);
          this.logger.log(`gRPC: Deleting section  ${data.sectionId}`, {
            ctx: SectionGrpcController.name,
          });

          await this.deleteSectionUseCase.execute(data);

          return { success: { deleted: true } };
        }
      );
    } catch (error) {
      this.logger.error(`Failed to delete section: ${error.message}`, {
        error,
      });

      if (error instanceof DomainException) {
        return {
          error: this.createErrorResponse(error),
        };
      }
      throw error;
    }
  }
  @GrpcMethod("CourseService", "GetSectionsByCourse")
  async getSectionsByCourse(
    data: GetSectionsByCourseRequest,
    metadata: Metadata
  ): Promise<SectionsResponse> {
    try {
      return await this.tracer.startActiveSpan(
        "SectionGrpcController.GetSectionsByCourse",
        async (span) => {
          span.setAttribute("course.id", data.courseId);
          this.logger.log(`gRPC: Fetching sections `, {
            ctx: SectionGrpcController.name,
          });

          const sections = await this.getSectionsByCourseUseCase.execute(
            data.courseId
          );

          return {
            sections: { sections: sections.map((section) => section.toGrpcResponse()) },
          } as SectionsResponse;
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get sections by course: ${error.message}`, {
        error,
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
