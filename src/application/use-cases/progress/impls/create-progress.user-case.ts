import { Injectable } from "@nestjs/common";
import { Progress, UnitType } from "src/domain/entities/progress.entity";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { LessonNotFoundException } from "src/domain/exceptions/lesson.exceptions";
import { ProgressEntryAlreadyExistException } from "src/domain/exceptions/progress.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { v4 as uuidv4 } from "uuid";
import { ICreateProgressUseCase } from "../interfaces/create-progress.interface";

@Injectable()
export class CreateProgressUseCase implements ICreateProgressUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _lessonRepository: ILessonRepository,
    private readonly _progressRepository: IProgressRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(enrollmentId: string, lessonId: string): Promise<Progress> {
    return await this._tracer.startActiveSpan(
      "CreateProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
          "lesson.id": lessonId,
        });
        this._logger.debug(
          `Creating progress for enrollment ${enrollmentId}, lesson ${lessonId}`,
          { ctx: CreateProgressUseCase.name },
        );

        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          span.setAttribute("enrollment.found", true);
          throw new EnrollmentNotFoundException(
            `Enrollment ${enrollmentId} not found`,
          );
        }
        span.setAttribute("enrollment.found", false);

        const lesson = await this._lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", true);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", false);

        const existingProgress =
          await this._progressRepository.findByEnrollmentIdAndLessonId(
            enrollmentId,
            lessonId,
          );
        if (existingProgress) {
          span.setAttribute("progress.alreadyExist", true);
          throw new ProgressEntryAlreadyExistException(
            `Progress entry already exists for lesson ${lesson} and enrollment ${enrollment}`,
          );
        }
        span.setAttribute("progress.alreadyExist", false);

        const progress = new Progress(
          uuidv4(),
          enrollmentId,
          lessonId,
          undefined,
          UnitType.LESSON,
        );
        await this._progressRepository.save(progress);

        span.setAttribute("progress.saved", true);
        this._logger.debug(`Progress created for enrollment ${enrollmentId}`, {
          ctx: CreateProgressUseCase.name,
        });
        return progress;
      },
    );
  }
}
