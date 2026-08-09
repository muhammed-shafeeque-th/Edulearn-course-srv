import { Injectable } from "@nestjs/common";
import { Module } from "@/domain/entities/module.entity";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IGetModulesByCourseUseCase } from "../interfaces/get-modules-by-course.interface";

@Injectable()
export class GetModulesByCourseUseCase implements IGetModulesByCourseUseCase {
  constructor(
    private readonly _moduleRepository: IModuleRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(courseId: string): Promise<Module[]> {
    return await this._tracer.startActiveSpan(
      "GetModulesByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this._logger.log(`Fetching modules by courseID ${courseId}`, {
          ctx: GetModulesByCourseUseCase.name,
        });

        const modules = await this._moduleRepository.findByCourseId(courseId);

        this._logger.log(`Modules ${modules.length} fetched`, {
          ctx: GetModulesByCourseUseCase.name,
        });
        return modules;
      },
    );
  }
}
