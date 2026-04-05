import { Injectable } from "@nestjs/common";
import { ModuleDto } from "src/application/dtos/module.dto";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetModulesByCourseUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(courseId: string): Promise<ModuleDto[]> {
    return await this.tracer.startActiveSpan(
      "GetModulesByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this.logger.log(`Fetching modules by courseID ${courseId}`, {
          ctx: GetModulesByCourseUseCase.name,
        });

        const modules = await this.moduleRepository.findByCourseId(courseId);

        this.logger.log(`Modules ${modules.length} fetched`, {
          ctx: GetModulesByCourseUseCase.name,
        });
        return modules.map(ModuleDto.fromDomain);
      },
    );
  }
}
