import { Injectable } from "@nestjs/common";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { QuizNotFoundException } from "src/domain/exceptions/quiz.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { DeleteQuizDto } from "src/presentation/grpc/dtos/quiz/delete-quiz.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IDeleteQuizUseCase } from "../interfaces/delete-quiz.interface";

@Injectable()
export class DeleteQuizUseCase implements IDeleteQuizUseCase {
  constructor(
    private readonly _quizRepository: IQuizRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: DeleteQuizDto): Promise<void> {
    return await this._tracer.startActiveSpan(
      "DeleteQuizUseCase.execute",
      async (span) => {
        span.setAttributes({
          "quiz.id": dto.quizId,
        });
         this._logger.log(`Deleting quiz ${dto.quizId}`, {
          ctx: DeleteQuizUseCase.name,
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

        const quiz = await this._quizRepository.findById(dto.quizId);
        if (!quiz) {
          span.setAttribute("quiz.found", false);
          throw new QuizNotFoundException(`Quiz ${dto.quizId} not found`);
        }
        span.setAttribute("quiz.found", true);

        await this._quizRepository.delete(quiz);
        span.setAttribute("quiz.deleted", true);
         this._logger.log(`Quiz ${dto.quizId} deleted`, {
          ctx: DeleteQuizUseCase.name,
        });
      },
    );
  }
}
