import { Injectable} from "@nestjs/common";
import {
  CourseNotFoundException,
  SectionNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { ISectionRepository } from "src/domain/repositories/section.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { DeleteSectionDto } from "src/presentation/grpc/dtos/section/delete-section.dto";

@Injectable()
export class DeleteSectionUseCase {
  constructor(
    private readonly sectionRepository: ISectionRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(dto: DeleteSectionDto): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteSectionUseCase.execute",
      async (span) => {
        span.setAttributes({
          "section.id": dto.sectionId,
        });
        this.logger.log(`Deleting section ${dto.sectionId}`, {
          ctx: DeleteSectionUseCase.name,
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

        const section = await this.sectionRepository.findById(dto.sectionId);
        if (!section) {
          span.setAttribute("section.found", false);
          throw new SectionNotFoundException(
            `Section ${dto.sectionId} not found`
          );
        }
        span.setAttribute("section.found", true);

        await this.sectionRepository.delete(section);

        span.setAttribute("section.deleted", true);
        this.logger.log(`Section ${dto.sectionId} deleted`, {
          ctx: DeleteSectionUseCase.name,
        });
      }
    );
  }
}
