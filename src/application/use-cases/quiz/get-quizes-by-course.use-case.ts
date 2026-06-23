import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

@Injectable()
export class GetQuizzesByCourseUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(courseId: string): Promise<QuizDto[]> {
    return await this.tracer.startActiveSpan(
      "GetQuizzesByCourseUseCase.execute",
      async (span) => {
        span.setAttributes({
          "course.id": courseId,
        });
        this.logger.log(`Fetching quizzes for course ${courseId}`, {
          ctx: GetQuizzesByCourseUseCase.name,
        });

        const quizzes = await this.quizRepository.findByCourseId(courseId);

        span.setAttribute("db.quizzes.count", quizzes.length);

        this.logger.log(`Quiz fetched for courseId ${courseId} `, {
          ctx: GetQuizzesByCourseUseCase.name,
        });
        return quizzes.map(QuizDto.fromDomain);
      },
    );
  }
}
