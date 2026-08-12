import { Injectable } from "@nestjs/common";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ModuleNotFoundException } from "src/domain/exceptions/module.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { DeleteModuleDto } from "src/presentation/grpc/dtos/module/delete-module.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IDeleteModuleUseCase } from "../interfaces/delete-module.interface";

@Injectable()
export class DeleteModuleUseCase implements IDeleteModuleUseCase {
  constructor(
    private readonly _moduleRepository: IModuleRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: DeleteModuleDto): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": dto.moduleId,
        });
        this._logger.debug(`Deleting module ${dto.moduleId}`, {
          ctx: DeleteModuleUseCase.name,
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

        await this._moduleRepository.delete(module);

        span.setAttribute("module.deleted", true);
        this._logger.debug(`Module ${dto.moduleId} deleted`, {
          ctx: DeleteModuleUseCase.name,
        });
      },
    );
  }
}
