import { Injectable } from "@nestjs/common";
import { Progress, UnitType } from "src/domain/entities/progress.entity";
import {
  CourseNotFoundException,
  EnrollmentNotFoundException,
  NotAuthorizedException,
} from "src/domain/exceptions/domain.exceptions";
import { ICourseRepository } from "src/domain/repositories/course.repository";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";

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

interface SectionDetailDTO {
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
  sections: SectionDetailDTO[];
}

@Injectable()
export class GetEnrollmentDetailUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) {}

  async execute(
    enrollmentId: string,
    userId: string
  ): Promise<EnrollmentDetailDTO> {
    return this.tracer.startActiveSpan(
      `${GetEnrollmentDetailUseCase.name}.execute`,
      async (span) => {
        try {
          this.logger.log(`Fetching enrollment [${enrollmentId}] detail`, {
            ctx: GetEnrollmentDetailUseCase.name,
            userId,
          });

          const enrollment = await this.enrollmentRepo.getById(enrollmentId, {
            includeCourse: false,
            includeProgressSummary: true,
          });


          if (!enrollment) {
            this.logger.warn(
              `Enrollment [${enrollmentId}] not found for user [${userId}]`,
              { ctx: GetEnrollmentDetailUseCase.name }
            );
            throw new EnrollmentNotFoundException(
              `Enrollment not found with id ${enrollmentId}`
            );
          }
          if (enrollment.getStudentId() !== userId) {
            this.logger.warn(
              `User [${userId}] not authorized to access enrollment [${enrollmentId}]`,
              { ctx: GetEnrollmentDetailUseCase.name }
            );
            throw new NotAuthorizedException(
              `User ${userId} is not authorized to access enrollment ${enrollmentId}`
            );
          }

          const course = await this.courseRepo.findById(
            enrollment.getCourseId()
          );

          if (!course) {
            this.logger.warn(
              `Course not found for enrollment [${enrollmentId}] (user [${userId}])`,
              { ctx: GetEnrollmentDetailUseCase.name }
            );
            throw new CourseNotFoundException("Course not found");
          }

          const progressEntries = enrollment.getProgressEntries();

          const progressMap = new Map<string, Progress>();
          progressEntries.forEach((p) => {
            progressMap.set(`${p.getUnitType()}:${p.getUnitId()}`, p);
          });

          const sections: SectionDetailDTO[] = course
            .getSections()
            .sort((a, b) => a.getOrder() - b.getOrder())
            .map((section) => {
              const lessons = section
                .getLessons()
                .sort((a, b) => a.getOrder() - b.getOrder())
                .map<LessonDetailDTO>((lesson) => {
                  const p = progressMap.get(
                    `${UnitType.LESSON}:${lesson.getId()}`
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
              const sectionQuiz = section.getQuiz();
              if (sectionQuiz) {
                const qProgress = progressMap.get(
                  `${UnitType.QUIZ}:${sectionQuiz.getId()}`
                );
                quiz = {
                  id: sectionQuiz.getId(),
                  title: sectionQuiz.getTitle(),
                  description: sectionQuiz.getDescription(),
                  timeLimit: sectionQuiz.getTimeLimit(),
                  questions: sectionQuiz.getQuestions().map((question) => ({
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
                  requirePassingScore: sectionQuiz.getIsRequired(),
                  passingScore: sectionQuiz.getPassingScore(),
                  completed: !!qProgress && qProgress.isCompleted(),
                  passed: qProgress?.getPassed(),
                  score: qProgress?.getScore(),
                  completedAt: qProgress?.getCompletedAt()?.toISOString(),
                };
              }

              return {
                id: section.getId(),
                title: section.getTitle(),
                description: section.getDescription(),
                order: section.getOrder(),
                isPublished: section.getIsPublished(),
                lessons,
                quiz,
              };
            });

          this.logger.log(`Enrollment [${enrollmentId}] detail fetched`, {
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
            sections,
          };
        } catch (error) {
          this.logger.error(
            `Failed to get enrollment detail [${enrollmentId}] for user [${userId}]`,
            { err: error, ctx: GetEnrollmentDetailUseCase.name }
          );
          throw error;
        }
      }
    );
  }
}
