import { Injectable } from "@nestjs/common";
import { SectionDto } from "src/application/dtos/section.dto";
import { Section } from "src/domain/entities/section.entity";
import {
  CourseNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ISectionRepository } from "src/domain/repositories/section.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CreateSectionRequestDto } from "src/presentation/grpc/dtos/section/create-section.dto";
import { v4 as uuidV4 } from "uuid";

@Injectable()
export class CreateSectionUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly sectionRepository: ISectionRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    dto: CreateSectionRequestDto,
    idempotencyKey: string
  ): Promise<SectionDto> {
    return await this.tracer.startActiveSpan(
      "CreateSectionUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": dto.courseId,
        });

        // Check for existing course by idempotency key
        const existingSection =
          await this.sectionRepository.findByIdempotencyKey(idempotencyKey);
        if (existingSection) {
          span.setAttribute("idempotency.duplicate", true);
          this.logger.info(
            `Section creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateSectionUseCase.name}`
          );
          return SectionDto.fromDomain(existingSection);
        }

        this.logger.log(`Creating section for course ${dto.courseId}`, {
          ctx: CreateSectionUseCase.name,
        });

        const course = await this.courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`
          );
        }

        if (course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException(
            "You are not authorized to perform this operation"
          );
        }

        const sectionId = uuidV4();
        span.setAttribute("course.found", true);

        const section = new Section({
          id: sectionId,
          courseId: dto.courseId,
          title: dto.title,
          idempotencyKey: idempotencyKey,
          order: dto.order,
          description: dto.description,
          isPublished: dto.isPublished,
        });
        await this.sectionRepository.save(section);

        span.setAttribute("course.section.created", true);

        this.logger.log(`Section created for course ${dto.courseId}`, {
          ctx: CreateSectionUseCase.name,
        });
        return SectionDto.fromDomain(section);
      }
    );
  }
}
