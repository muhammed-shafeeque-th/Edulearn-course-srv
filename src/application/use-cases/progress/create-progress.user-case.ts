import { Injectable } from "@nestjs/common";
import { ProgressDto } from "src/application/dtos/progress.dto";
import {
  Progress,
  UnitType,
} from "src/domain/entities/progress.entity";
import {
  EnrollmentNotFoundException,
  LessonNotFoundException,
  ProgressEntryAlreadyExistException,
} from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CreateProgressUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly lessonRepository: ILessonRepository,
    private readonly progressRepository: IProgressRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(enrollmentId: string, lessonId: string): Promise<ProgressDto> {
    return await this.tracer.startActiveSpan(
      "CreateProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
          "lesson.id": lessonId,
        });
        this.logger.log(
          `Creating progress for enrollment ${enrollmentId}, lesson ${lessonId}`,
          { ctx: CreateProgressUseCase.name }
        );

        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          span.setAttribute("enrollment.found", true);
          throw new EnrollmentNotFoundException(
            `Enrollment ${enrollmentId} not found`
          );
        }
        span.setAttribute("enrollment.found", false);

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", true);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", false);

        const existingProgress =
          await this.progressRepository.findByEnrollmentIdAndLessonId(
            enrollmentId,
            lessonId
          );
        if (existingProgress) {
          span.setAttribute("progress.alreadyExist", true);
          throw new ProgressEntryAlreadyExistException(
            `Progress entry already exists for lesson ${lesson} and enrollment ${enrollment}`
          );
        }
        span.setAttribute("progress.alreadyExist", false);

        const progress = new Progress(
          uuidv4(),
          enrollmentId,
          lessonId,
          undefined,
          UnitType.LESSON
        );
        await this.progressRepository.save(progress);

        span.setAttribute("progress.saved", true);
        this.logger.log(`Progress created for enrollment ${enrollmentId}`, {
          ctx: CreateProgressUseCase.name,
        });
        return ProgressDto.fromDomain(progress);
      }
    );
  }
}
