import { Injectable } from "@nestjs/common";
import { ModuleDto } from "src/application/dtos/module.dto";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import {
  ModuleNotFoundException,
} from "src/domain/exceptions/module.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { UpdateModuleDto } from "src/presentation/grpc/dtos/module/update-module.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";

@Injectable()
export class UpdateModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: UpdateModuleDto): Promise<ModuleDto> {
    return await this.tracer.startActiveSpan(
      "UpdateModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "module.id": dto.moduleId,
        });
        this.logger.log(`Updating module ${dto.moduleId}`, {
          ctx: UpdateModuleUseCase.name,
        });
        const course = await this.courseRepository.findById(dto.courseId);
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

        const module = await this.moduleRepository.findById(dto.moduleId);
        if (!module) {
          span.setAttribute("module.found", false);
          throw new ModuleNotFoundException(`Module ${dto.moduleId} not found`);
        }
        span.setAttribute("module.found", true);

        module.updateDetails(dto);
        await this.moduleRepository.update(module);
        span.setAttribute("module.updated", true);

        this.logger.log(`Module ${dto.moduleId} updated`, {
          ctx: UpdateModuleUseCase.name,
        });
        return ModuleDto.fromDomain(module);
      },
    );
  }
}
