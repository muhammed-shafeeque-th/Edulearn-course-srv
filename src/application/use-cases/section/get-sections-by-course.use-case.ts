import { Injectable } from "@nestjs/common";
import { SectionDto } from "src/application/dtos/section.dto";
import { ISectionRepository } from "src/domain/repositories/section.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetSectionsByCourseUseCase {
  constructor(
    private readonly sectionRepository: ISectionRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(courseId: string): Promise<SectionDto[]> {
    return await this.tracer.startActiveSpan(
      "GetSectionsByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this.logger.log(`Fetching sections by courseID ${courseId}`, {
          ctx: GetSectionsByCourseUseCase.name,
        });

        const sections = await this.sectionRepository.findByCourseId(courseId);

        this.logger.log(`Sections ${sections.length} fetched`, {
          ctx: GetSectionsByCourseUseCase.name,
        });
        return sections.map(SectionDto.fromDomain);
      },
    );
  }
}
