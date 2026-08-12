import { Injectable } from "@nestjs/common";
import { Module } from "@/domain/entities/module.entity";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetModuleUseCase } from "../interfaces/get-module.interface";

@Injectable()
export class GetModuleUseCase implements IGetModuleUseCase {
  constructor(
    private readonly _moduleRepository: IModuleRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(moduleId: string): Promise<Module> {
    return await this._tracer.startActiveSpan(
      "GetModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": moduleId,
        });
        this._logger.debug(`Fetching module ${moduleId}`, {
          ctx: GetModuleUseCase.name,
        });

        const module = await this._moduleRepository.findById(moduleId);
        if (!module) {
          span.setAttribute("module.found", false);
          throw new ModuleNotFoundException(`Module ${moduleId} not found`);
        }
        span.setAttribute("module.found", true);

        this._logger.debug(`Module ${moduleId} fetched`, {
          ctx: GetModuleUseCase.name,
        });
        return module;
      },
    );
  }
}
