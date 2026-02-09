import { Injectable } from "@nestjs/common";
import { ProgressDto } from "src/application/dtos/progress.dto";
import { EnrollmentNotFoundException, LessonNotFoundException, ProgressNotFoundException } from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ILessonRepository } from "src/domain/repositories/lesson.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { IKafkaProducer } from "src/application/services/kafka-producer.interface";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class UpdateProgressUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly lessonRepository: ILessonRepository,
    private readonly progressRepository: IProgressRepository,
    private readonly kafkaProducer: IKafkaProducer,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<ProgressDto> {
    return await this.tracer.startActiveSpan(
      "UpdateProgressUseCase.execute",
      async (span) => {
        span.setAttributes({
          "enrollment.id": enrollmentId,
        });

        this.logger.log(
          `Updating progress for enrollment ${enrollmentId}, lesson ${lessonId}`,
          { ctx: UpdateProgressUseCase.name },
        );

        const enrollment =
          await this.enrollmentRepository.getById(enrollmentId);
        if (!enrollment) {
          span.setAttribute("enrollment.found", false);
          throw new EnrollmentNotFoundException(`Enrollment ${enrollmentId} not found`);
        }
        span.setAttribute("enrollment.found", true);

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
          span.setAttribute("lesson.found", false);
          throw new LessonNotFoundException(`Lesson ${lessonId} not found`);
        }
        span.setAttribute("lesson.found", true);

        let progress =
          await this.progressRepository.findByEnrollmentIdAndLessonId(
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
          // await this.kafkaProducer.produce("course-events", {
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

        await this.progressRepository.save(progress);
        span.setAttribute("progress.saved", true);

        this.logger.log(`Progress updated for enrollment ${enrollmentId}`, {
          ctx: UpdateProgressUseCase.name,
        });
        return ProgressDto.fromDomain(progress);
      },
    );
  }
}
