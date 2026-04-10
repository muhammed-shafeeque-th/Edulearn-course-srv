import { Injectable } from "@nestjs/common";
import { ModuleDto } from "src/application/dtos/module.dto";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(moduleId: string): Promise<ModuleDto> {
    return await this.tracer.startActiveSpan(
      "GetModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": moduleId,
        });
        this.logger.log(`Fetching module ${moduleId}`, {
          ctx: GetModuleUseCase.name,
        });

        const module = await this.moduleRepository.findById(moduleId);
        if (!module) {
          span.setAttribute("module.found", false);
          throw new ModuleNotFoundException(`Module ${moduleId} not found`);
        }
        span.setAttribute("module.found", true);

        this.logger.log(`Module ${moduleId} fetched`, {
          ctx: GetModuleUseCase.name,
        });
        return ModuleDto.fromDomain(module);
      },
    );
  }
}
