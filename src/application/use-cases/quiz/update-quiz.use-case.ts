import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { Question, QuestionType } from "src/domain/entities/quiz.entity";
import {
  CourseNotFoundException,
  QuizNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { UpdateQuizDto } from "src/presentation/grpc/dtos/quiz/update-quiz.dto";

@Injectable()
export class UpdateQuizUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  /**
   * Updates a quiz entity.
   *
   * @param dto UpdateQuizDto - Data Transfer Object containing update info
   * @returns Promise<QuizDto> - The updated quiz
   * @throws CourseNotFoundException, QuizNotFoundException, UnauthorizedException
   */
  async execute(dto: UpdateQuizDto): Promise<QuizDto> {
    return await this.tracer.startActiveSpan(
      "UpdateQuizUseCase.execute",
      async (span) => {
        try {
          span.setAttributes({
            "quiz.id": dto.quizId,
            "quiz.title": dto.title,
            "quiz.timeLimit": dto.timeLimit,
            "quiz.passingScore": dto.passingScore,
            "quiz.questionsCount": dto.questions.length,
          });
          this.logger.log(`Updating quiz ${dto.quizId}`, {
            ctx: UpdateQuizUseCase.name,
          });

          // Validate course existence
          const course = await this.courseRepository.findById(dto.courseId);
          if (!course) {
            span.setAttribute("course.found", false);
            this.logger.warn(`Course with ID ${dto.courseId} not found`, {
              ctx: UpdateQuizUseCase.name,
            });
            throw new CourseNotFoundException(
              `Course with ID ${dto.courseId} not found`
            );
          }
          span.setAttribute("course.found", true);

          // Authorization check
          if (course.getInstructorId() !== dto.userId) {
            this.logger.warn(
              `Unauthorized attempt by user ${dto.userId} to update quiz ${dto.quizId}`,
              { ctx: UpdateQuizUseCase.name }
            );
            throw new UnauthorizedException(
              "You are not authorized to perform this operation"
            );
          }

          // Fetch quiz to update
          const quiz = await this.quizRepository.findById(dto.quizId);
          if (!quiz) {
            span.setAttribute("quiz.found", false);
            this.logger.warn(`Quiz ${dto.quizId} not found for update`, {
              ctx: UpdateQuizUseCase.name,
            });
            throw new QuizNotFoundException(`Quiz ${dto.quizId} not found`);
          }
          span.setAttribute("quiz.found", true);

          // Prepare and validate questions
          const questions: Question[] = dto.questions.map((question) => {
            // Defensive construction, domain validation
            return new Question({
              id: question.id,
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

          await this.quizRepository.save(quiz);
          span.setAttribute("quiz.updated", true);

          this.logger.log(`Quiz ${dto.quizId} updated`, {
            ctx: UpdateQuizUseCase.name,
          });
          return QuizDto.fromDomain(quiz);
        } catch (error) {
          this.logger.error(`Error updating quiz: ${error.message}`, {
            stack: error.stack,
            ctx: UpdateQuizUseCase.name,
          });
          if (span) {
            span.setAttribute("quiz.update.error", true);
            span.recordException(error);
          }
          throw error;
        }
      }
    );
  }
}
