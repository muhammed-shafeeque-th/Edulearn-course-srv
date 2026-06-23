import { Injectable } from "@nestjs/common";
import { Progress, UnitType } from "src/domain/entities/progress.entity";
import { CourseNotFoundException } from "src/domain/exceptions/course.exceptions";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { IGetEnrollmentDetailUseCase } from "../interfaces/get-enrollment-detail.interface";

interface LessonDetailDTO {
  id: string;
  title: string;
  order: number;
  duration?: number;
  completed: boolean;
  completedAt?: string;
}

export interface QuestionOptionDTO {
  value: string;
}

export interface QuizQuestionDTO {
  id: string;
  requirePassingScore: boolean;
  options: QuestionOptionDTO[];
  timeLimit?: number;
  question: string;
  explanation?: string;
  score?: number;
  correctAnswer?: string;
  type: string;
}

export interface QuizDetailDTO {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestionDTO[];
  timeLimit?: number;
  requirePassingScore: boolean;
  passingScore?: number;
  completed: boolean;
  passed?: boolean;
  score?: number;
  completedAt?: string;
}

interface ModuleDetailDTO {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: LessonDetailDTO[];
  quiz?: QuizDetailDTO;
}

export interface EnrollmentDetailDTO {
  enrollmentId: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  status: string;
  enrolledAt: string;
  modules: ModuleDetailDTO[];
}

@Injectable()
export class GetEnrollmentDetailUseCase implements IGetEnrollmentDetailUseCase {
  constructor(
    private readonly _enrollmentRepo: IEnrollmentRepository,
    private readonly _courseRepo: ICourseRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(
    enrollmentId: string,
    userId: string,
  ): Promise<EnrollmentDetailDTO> {
    return this._tracer.startActiveSpan(
      `${GetEnrollmentDetailUseCase.name}.execute`,
      async (span) => {
        try {
           this._logger.log(`Fetching enrollment [${enrollmentId}] detail`, {
            ctx: GetEnrollmentDetailUseCase.name,
            userId,
          });

          const enrollment = await this._enrollmentRepo.findById(enrollmentId, {
            includeCourse: false,
            includeProgressSummary: true,
          });

          if (!enrollment) {
             this._logger.warn(
              `Enrollment [${enrollmentId}] not found for user [${userId}]`,
              { ctx: GetEnrollmentDetailUseCase.name },
            );
            throw new EnrollmentNotFoundException(
              `Enrollment not found with id ${enrollmentId}`,
            );
          }
          if (enrollment.getStudentId() !== userId) {
             this._logger.warn(
              `User [${userId}] not authorized to access enrollment [${enrollmentId}]`,
              { ctx: GetEnrollmentDetailUseCase.name },
            );
            throw new UnauthorizedException(
              `User ${userId} is not authorized to access enrollment ${enrollmentId}`,
            );
          }

          const course = await this._courseRepo.findById(
            enrollment.getCourseId(),
          );

          if (!course) {
             this._logger.warn(
              `Course not found for enrollment [${enrollmentId}] (user [${userId}])`,
              { ctx: GetEnrollmentDetailUseCase.name },
            );
            throw new CourseNotFoundException("Course not found");
          }

          const progressEntries = enrollment.getProgressEntries();

          const progressMap = new Map<string, Progress>();
          progressEntries.forEach((p) => {
            progressMap.set(`${p.getUnitType()}:${p.getUnitId()}`, p);
          });

          const modules: ModuleDetailDTO[] = course
            .getModules()
            .sort((a, b) => a.getOrder() - b.getOrder())
            .map((module) => {
              const lessons = module
                .getLessons()
                .sort((a, b) => a.getOrder() - b.getOrder())
                .map<LessonDetailDTO>((lesson) => {
                  const p = progressMap.get(
                    `${UnitType.LESSON}:${lesson.getId()}`,
                  );
                  return {
                    id: lesson.getId(),
                    title: lesson.getTitle(),
                    order: lesson.getOrder(),
                    duration: lesson.getDuration(),
                    completed: !!p && p.isCompleted(),
                    completedAt: p?.getCompletedAt()?.toISOString(),
                  };
                });

              let quiz: QuizDetailDTO | undefined = undefined;
              const moduleQuiz = module.getQuiz();
              if (moduleQuiz) {
                const qProgress = progressMap.get(
                  `${UnitType.QUIZ}:${moduleQuiz.getId()}`,
                );
                quiz = {
                  id: moduleQuiz.getId(),
                  title: moduleQuiz.getTitle(),
                  description: moduleQuiz.getDescription(),
                  timeLimit: moduleQuiz.getTimeLimit(),
                  questions: moduleQuiz.getQuestions().map((question) => ({
                    id: question.getId(),
                    type: question.getType(),
                    question: question.getQuestion(),
                    options: question
                      .getOptions()
                      .map((option) => ({ value: option.value })),
                    requirePassingScore: question.isRequired(),
                    correctAnswer: question.getCorrectAnswer()?.toString(),
                    explanation: question.getExplanation(),
                    score: question.getPoint(),
                    timeLimit: question.getTimeLimit(),
                  })),
                  requirePassingScore: moduleQuiz.getIsRequired(),
                  passingScore: moduleQuiz.getPassingScore(),
                  completed: !!qProgress && qProgress.isCompleted(),
                  passed: qProgress?.getPassed(),
                  score: qProgress?.getScore(),
                  completedAt: qProgress?.getCompletedAt()?.toISOString(),
                };
              }

              return {
                id: module.getId(),
                title: module.getTitle(),
                description: module.getDescription(),
                order: module.getOrder(),
                isPublished: module.getIsPublished(),
                lessons,
                quiz,
              };
            });

           this._logger.log(`Enrollment [${enrollmentId}] detail fetched`, {
            ctx: GetEnrollmentDetailUseCase.name,
            userId,
          });

          return {
            enrollmentId: enrollment.getId(),
            userId: enrollment.getStudentId(),
            courseId: enrollment.getCourseId(),
            progressPercent: enrollment.getProgressPercent(),
            status: enrollment.getStatus(),
            enrolledAt: enrollment.getEnrolledAt().toISOString(),
            modules,
          };
        } catch (error) {
           this._logger.error(
            `Failed to get enrollment detail [${enrollmentId}] for user [${userId}]`,
            { err: error, ctx: GetEnrollmentDetailUseCase.name },
          );
          throw error;
        }
      },
    );
  }
}
