import { Injectable } from "@nestjs/common";
import { Quiz } from "@/domain/entities/quiz.entity";
import { Question, QuestionType } from "src/domain/entities/quiz.entity";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { QuizNotFoundException } from "src/domain/exceptions/quiz.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UpdateQuizDto } from "src/presentation/grpc/dtos/quiz/update-quiz.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { v4 as uuidV4 } from "uuid";
import { IUpdateQuizUseCase } from "../interfaces/update-quiz.interface";

@Injectable()
export class UpdateQuizUseCase implements IUpdateQuizUseCase {
  constructor(
    private readonly _quizRepository: IQuizRepository,
    private readonly _courseRepository: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UpdateQuizDto): Promise<Quiz> {
    return await this._tracer.startActiveSpan(
      "UpdateQuizUseCase.execute",
      async (span) => {
        span.setAttributes({
          "quiz.id": dto.quizId,
          "quiz.title": dto.title,
          "quiz.timeLimit": dto.timeLimit,
          "quiz.passingScore": dto.passingScore,
          "quiz.questionsCount": dto.questions.length,
        });
        this._logger.log(`Updating quiz ${dto.quizId}`, {
          ctx: UpdateQuizUseCase.name,
        });

        // Validate course existence
        const course = await this._courseRepository.findById(dto.courseId);
        if (!course) {
          span.setAttribute("course.found", false);
          this._logger.warn(`Course with ID ${dto.courseId} not found`, {
            ctx: UpdateQuizUseCase.name,
          });
          throw new CourseNotFoundException(
            `Course with ID ${dto.courseId} not found`,
          );
        }
        span.setAttribute("course.found", true);

        // Authorization check
        if (course.getInstructorId() !== dto.userId) {
          this._logger.warn(
            `Unauthorized attempt by user ${dto.userId} to update quiz ${dto.quizId}`,
            { ctx: UpdateQuizUseCase.name },
          );
          throw new UnauthorizedException(
            "You are not authorized to perform this operation",
          );
        }

        // Fetch quiz to update
        const quiz = await this._quizRepository.findById(dto.quizId);
        if (!quiz) {
          span.setAttribute("quiz.found", false);
          this._logger.warn(`Quiz ${dto.quizId} not found for update`, {
            ctx: UpdateQuizUseCase.name,
          });
          throw new QuizNotFoundException(`Quiz ${dto.quizId} not found`);
        }
        span.setAttribute("quiz.found", true);

        const questions: Question[] = dto.questions.map((question) => {
          // Defensive construction, domain validation
          return new Question({
            id: question.id ?? uuidV4(),
            question: question.question,
            correctAnswer: question.correctAnswer,
            type: question.type as QuestionType,
            explanation: question.explanation,
            options: question.options,
            point: question.points,
            required: question.required,
            timeLimit: question.timeLimit,
          });
        });

        quiz.updateDetails({
          title: dto.title,
          description: dto.description,
          timeLimit: dto.timeLimit,
          maxAttempts: dto.maxAttempts,
          passingScore: dto.passingScore,
          isRequired: dto.isRequired,
          questions,
        });

        await this._quizRepository.save(quiz);
        span.setAttribute("quiz.updated", true);

        this._logger.log(`Quiz ${dto.quizId} updated`, {
          ctx: UpdateQuizUseCase.name,
        });
        return quiz;
      },
    );
  }
}
