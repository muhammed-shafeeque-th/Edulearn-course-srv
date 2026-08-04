import { Injectable } from "@nestjs/common";
import { ModuleDto } from "src/application/dtos/module.dto";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UpdateModuleDto } from "src/presentation/grpc/dtos/module/update-module.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IUpdateModuleUseCase } from "../interfaces/update-module.interface";

@Injectable()
export class UpdateModuleUseCase implements IUpdateModuleUseCase {
  constructor(
    private readonly _moduleRepository: IModuleRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateModuleDto): Promise<ModuleDto> {
    return await this._tracer.startActiveSpan(
      "UpdateModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": dto.moduleId,
        });
        this._logger.log(`Updating module ${dto.moduleId}`, {
          ctx: UpdateModuleUseCase.name,
        });
        const course = await this._courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`,
          );
        }

        if (course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException(
            "You are not authorized to perform this operation",
          );
        }

        const module = await this._moduleRepository.findById(dto.moduleId);
        if (!module) {
          span.setAttribute("module.found", false);
          throw new ModuleNotFoundException(`Module ${dto.moduleId} not found`);
        }
        span.setAttribute("module.found", true);

        module.updateDetails(dto);
        await this._moduleRepository.update(module);
        span.setAttribute("module.updated", true);

        this._logger.log(`Module ${dto.moduleId} updated`, {
          ctx: UpdateModuleUseCase.name,
        });
        return ModuleDto.fromDomain(module);
      },
    );
  }
}
