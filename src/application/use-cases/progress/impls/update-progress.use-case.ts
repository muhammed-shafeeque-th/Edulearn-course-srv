import { Injectable } from "@nestjs/common";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { LessonNotFoundException } from "src/domain/exceptions/lesson.exceptions";
import { ProgressNotFoundException } from "src/domain/exceptions/progress.exceptions";
import { IUpdateProgressUseCase } from "../interfaces/update-progress.interface";

@Injectable()
export class UpdateProgressUseCase implements IUpdateProgressUseCase {
  constructor(
    private readonly _enrollmentRepository: IEnrollmentRepository,
    private readonly _lessonRepository: ILessonRepository,
    private readonly _progressRepository: IProgressRepository,
    private readonly _kafkaProducer: IEventProducer,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<ProgressDto> {
    return await this._tracer.startActiveSpan(
      "UpdateProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

         this._logger.log(
          `Updating progress for enrollment ${enrollmentId}, lesson ${lessonId}`,
          { ctx: UpdateProgressUseCase.name },
        );

        const enrollment =
          await this._enrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
          span.setAttribute("enrollment.found", false);
          throw new EnrollmentNotFoundException(
            `Enrollment ${enrollmentId} not found`,
          );
        }
        span.setAttribute("enrollment.found", true);

        const lesson = await this._lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", true);

        let progress =
          await this._progressRepository.findByEnrollmentIdAndLessonId(
            enrollmentId,
            lessonId,
          );
        if (!progress) {
          span.setAttribute("progress.found", false);
          throw new ProgressNotFoundException("Progress entry not found");
        }
        span.setAttribute("progress.found", true);

        if (completed) {
          // progress.markQuizCompleted();
          // await this._kafkaProducer.produce("course-events", {
          //   event: "LESSON_COMPLETED",
          //   userId: enrollment.getUserId(),
          //   courseId: enrollment.getCourseId(),
          //   lessonId,
          //   progressId: progress.getId(),
          //   timestamp: new Date().toISOString(),
          // });
          span.setAttribute("event.sent", true);
          span.setAttribute("event.sent.type", "LESSON_COMPLETED");
        }

        await this._progressRepository.save(progress);
        span.setAttribute("progress.saved", true);

         this._logger.log(`Progress updated for enrollment ${enrollmentId}`, {
          ctx: UpdateProgressUseCase.name,
        });
        return ProgressDto.fromDomain(progress);
      },
    );
  }
}
