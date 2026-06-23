import { Injectable } from "@nestjs/common";
import { QuizDto } from "src/application/dtos/quiz.dto";
import { Quiz, Question, QuestionType } from "src/domain/entities/quiz.entity";
import {
  CourseNotFoundException,
  UnauthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import { CreateQuizDto } from "src/presentation/grpc/dtos/quiz/create-quiz.dto";
import { v4 as uuidV4 } from "uuid";

@Injectable()
export class CreateQuizUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  /**
   * Creates a quiz for a course section.
   * @param dto CreateQuizDto - The quiz data transfer object
   * @param idempotencyKey string - Key for idempotency and deduplication
   * @returns Promise<QuizDto>
   */
  async execute(dto: CreateQuizDto, idempotencyKey: string): Promise<QuizDto> {
    return this.tracer.startActiveSpan(
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
            await this.quizRepository.findByIdempotencyKey(idempotencyKey);
          if (existingQuiz) {
            span.setAttribute("idempotency.duplicate", true);
            this.logger.info(
              `Quiz creation deduplicated by idempotencyKey: ${idempotencyKey} in ${CreateQuizUseCase.name}`
            );
            return QuizDto.fromDomain(existingQuiz);
          }

          const existingSectionQuiz = await this.quizRepository.findBySectionId(
            dto.sectionId
          );
          if (existingSectionQuiz) {
            span.setAttribute("section.quiz.duplicate", true);
            this.logger.info(
              `Quiz creation deduplicated by sectionId: ${dto.sectionId} in ${CreateQuizUseCase.name}`
            );
            return QuizDto.fromDomain(existingSectionQuiz);
          }

          this.logger.log(`Creating quiz for course ${dto.courseId}`, {
            ctx: CreateQuizUseCase.name,
          });

          // Validate course existence
          const course = await this.courseRepository.findById(dto.courseId);
          if (!course) {
            span.setAttribute("course.found", false);
            this.logger.warn(
              `Course not found: ${dto.courseId} in ${CreateQuizUseCase.name}`
            );
            throw new CourseNotFoundException(
              `Course with ID ${dto.courseId} not found`
            );
          }
          span.setAttribute("course.found", true);

          // Authorization check
          if (course.getInstructorId() !== dto.userId) {
            this.logger.warn(
              `Unauthorized attempt by user ${dto.userId} to create quiz for course ${dto.courseId}`,
              { ctx: CreateQuizUseCase.name }
            );
            throw new UnauthorizedException(
              "You are not authorized to perform this operation"
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
            sectionId: dto.sectionId,
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

          await this.quizRepository.save(quiz);
          span.setAttribute("quiz.saved", true);

          this.logger.log(`Quiz created for course ${dto.courseId}`, {
            ctx: CreateQuizUseCase.name,
          });
          return QuizDto.fromDomain(quiz);
        } catch (error) {
          this.logger.error(
            `Error creating quiz: ${error.message}`,

            { stack: error.stack, ctx: CreateQuizUseCase.name }
          );
          span.setAttribute("quiz.error", true);
          span.recordException(error);
          throw error;
        }
      }
    );
  }
}
