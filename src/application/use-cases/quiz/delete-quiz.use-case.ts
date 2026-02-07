import { Injectable} from "@nestjs/common";
import { CourseNotFoundException, QuizNotFoundException, UnauthorizedException } from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { DeleteQuizDto } from "src/presentation/grpc/dtos/quiz/delete-quiz.dto";

@Injectable()
export class DeleteQuizUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {}

  async execute(dto: DeleteQuizDto): Promise<void> {
    return await this.tracer.startActiveSpan(
      "DeleteQuizUseCase.execute",
      async (span) => {
        span.setAttributes({
          "quiz.id": dto.quizId,
        });
        this.logger.log(`Deleting quiz ${dto.quizId}`, {
          ctx: DeleteQuizUseCase.name,
        });
        const course = await this.courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`
          );
        }

        if(course.getInstructorId() !== dto.userId) {
          throw new UnauthorizedException("You are not authorized to perform this operation");
        }

        const quiz = await this.quizRepository.findById(dto.quizId);
        if (!quiz) {
          span.setAttribute("quiz.found", false);
          throw new QuizNotFoundException(`Quiz ${dto.quizId} not found`);
        }
        span.setAttribute("quiz.found", true);

        await this.quizRepository.delete(quiz);
        span.setAttribute("quiz.deleted", true);
        this.logger.log(`Quiz ${dto.quizId} deleted`, {
          ctx: DeleteQuizUseCase.name,
        });
      },
    );
  }
}
