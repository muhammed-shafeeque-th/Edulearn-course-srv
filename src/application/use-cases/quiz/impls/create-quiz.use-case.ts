import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { Quiz, Question, QuestionType } from "src/domain/entities/quiz.entity";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { CreateQuizDto } from "src/presentation/grpc/dtos/quiz/create-quiz.dto";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { v4 as uuidV4 } from "uuid";
import { ICreateQuizUseCase } from "../interfaces/create-quiz.interface";

@Injectable()
export class CreateQuizUseCase implements ICreateQuizUseCase {
  constructor(
    private readonly _courseRepository: ICourseRepository,
    private readonly _quizRepository: IQuizRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: CreateQuizDto, idempotencyKey: string): Promise<QuizDto> {
    return this._tracer.startActiveSpan(
      "CreateQuizUseCase.execute",
      async (span) => {
        try {
          span.setAttributes({
            "course.id": dto.courseId,
            "quiz.title": dto.title,
            "quiz.timeLimit": dto.timeLimit,
            "quiz.passingScore": dto.passingScore,
            "quiz.questionsCount": dto.questions.length,
          });

          const existingQuiz =
            await this._quizRepository.findByIdempotencyKey(idempotencyKey);
          if (existingQuiz) {
            span.setAttribute("idempotency.duplicate", true);
             this._logger.debug(
              `Quiz creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateQuizUseCase.name}`,
            );
            return QuizDto.fromDomain(existingQuiz);
          }

          const existingModuleQuiz = await this._quizRepository.findByModuleId(
            dto.moduleId,
          );
          if (existingModuleQuiz) {
            span.setAttribute("module.quiz.duplicate", true);
             this._logger.debug(
              `Quiz creation deduplicated by moduleId: ${dto.moduleId} in ${CreateQuizUseCase.name}`,
            );
            return QuizDto.fromDomain(existingModuleQuiz);
          }

           this._logger.log(`Creating quiz for course ${dto.courseId}`, {
            ctx: CreateQuizUseCase.name,
          });

          // Validate course existence
          const course = await this._courseRepository.findById(dto.courseId);
          if (!course) {
            span.setAttribute("course.found", false);
             this._logger.warn(
              `Course not found: ${dto.courseId} in ${CreateQuizUseCase.name}`,
            );
            throw new CourseNotFoundException(
              `Course with ID ${dto.courseId} not found`,
            );
          }
          span.setAttribute("course.found", true);

          // Authorization check
          if (course.getInstructorId() !== dto.userId) {
             this._logger.warn(
              `Unauthorized attempt by user ${dto.userId} to create quiz for course ${dto.courseId}`,
              { ctx: CreateQuizUseCase.name },
            );
            throw new UnauthorizedException(
              "You are not authorized to perform this operation",
            );
          }

          // Build questions, validating via domain entities
          const questions: Question[] = dto.questions.map((question) => {
            return new Question({
              id: uuidV4(),
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

          const quizId = uuidV4();
          const quiz = new Quiz({
            id: quizId,
            moduleId: dto.moduleId,
            courseId: dto.courseId,
            idempotencyKey,
            title: dto.title,
            description: dto.description,
            timeLimit: dto.timeLimit,
            maxAttempts: dto.maxAttempts,
            passingScore: dto.passingScore,
            questions,
            isRequired: dto.isRequired,
          });

          await this._quizRepository.save(quiz);
          span.setAttribute("quiz.saved", true);

           this._logger.log(`Quiz created for course ${dto.courseId}`, {
            ctx: CreateQuizUseCase.name,
          });
          return QuizDto.fromDomain(quiz);
        } catch (error: any) {
           this._logger.error(
            `Error creating quiz: ${error.message}`,

            { stack: error.stack, ctx: CreateQuizUseCase.name },
          );
          throw error;
        }
      },
    );
  }
}
