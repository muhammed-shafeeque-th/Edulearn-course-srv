import { Injectable } from "@nestjs/common";
import { ModuleDto } from "src/application/dtos/module.dto";
import { Module } from "src/domain/entities/module.entity";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IModuleRepository } from "src/domain/repositories/module.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CreateModuleRequestDto } from "src/presentation/grpc/dtos/module/create-module.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { v4 as uuidV4 } from "uuid";
import { ICreateModuleUseCase } from "../interfaces/create-module.interface";

@Injectable()
export class CreateModuleUseCase implements ICreateModuleUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _moduleRepository: IModuleRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    dto: CreateModuleRequestDto,
    idempotencyKey: string,
  ): Promise<ModuleDto> {
    return await this._tracer.startActiveSpan(
      "CreateModuleUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": dto.courseId,
        });

        // Check for existing course by idempotency key
        const existingModule =
          await this._moduleRepository.findByIdempotencyKey(idempotencyKey);
        if (existingModule) {
          span.setAttribute("idempotency.duplicate", true);
          this._logger.debug(
            `Module creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateModuleUseCase.name}`,
          );
          return ModuleDto.fromDomain(existingModule);
        }

        this._logger.log(`Creating module for course ${dto.courseId}`, {
          ctx: CreateModuleUseCase.name,
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

        const moduleId = uuidV4();
        span.setAttribute("course.found", true);

        const module = new Module({
          id: moduleId,
          courseId: dto.courseId,
          title: dto.title,
          idempotencyKey: idempotencyKey,
          order: dto.order,
          description: dto.description,
          isPublished: dto.isPublished,
        });
        await this._moduleRepository.save(module);

        span.setAttribute("course.module.created", true);

        this._logger.log(`Module created for course ${dto.courseId}`, {
          ctx: CreateModuleUseCase.name,
        });
        return ModuleDto.fromDomain(module);
      },
    );
  }
}
