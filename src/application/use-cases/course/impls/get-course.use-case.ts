import { Injectable } from "@nestjs/common";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { Course } from "@/domain/entities/course.entity";
import { IGetCourseUseCase } from "../interfaces/get-course.interface";

@Injectable()
export class GetCourseUseCase implements IGetCourseUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(id: string): Promise<Course> {
    return await this._tracer.startActiveSpan(
      "GetCourseUseCase.execute",
      async (span) => {
          this._logger.debug(
            `Fetching course with ID: ${id} in ${GetCourseUseCase.name}`,
          );

          this._logger.debug(`Query DB for course ${id}`);
          const course = await this._courseRepository.findById(id);
          if (!course) {
            this._logger.debug(`Course not found in DB with Id: ${id}`);
            throw new CourseNotFoundException(`Course with ID ${id} not found`);
          }

          return course;
        
      },
    );
  }
}
