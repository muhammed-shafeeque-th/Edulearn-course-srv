import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import { EnrollmentStatus } from "src/domain/entities/enrollment.entity";
import { Question, QuestionType, Quiz } from "src/domain/entities/quiz.entity";
import {
  BadRequestException,
  EnrollmentNotFoundException,
  NotAuthorizedException,
  ProgressNotFoundException,
  QuizNotFoundException,
} from "src/domain/exceptions/domain.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IProgressRepository } from "src/domain/repositories/progress.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";

// export interface SubmitQuizAttemptRequest {
//   answers: { questionId: string; answers: string[] }[];
//   timeSpent: number;
// }

export interface SubmitQuizAttemptResponse {
  score: number;
  passed: boolean;
  completed: boolean;
  attempts: number;
  milestone?: {
    id: string;
    type: "QUIZ_PASSED" | "QUIZ_PERFECT" | string;
    achievedAt: string;
  };
}

@Injectable()
export class SubmitQuizAttemptUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly progressRepo: IProgressRepository,
    private readonly quizRepo: IQuizRepository
  ) {}

  /**
   * Executes submission of a quiz attempt, updating progress and milestones.
   */
  async execute(input: {
    enrollmentId: string;
    quizId: string;
    answers: { questionId: string; answers: string[] }[];
    timeSpent: number;
  }): Promise<SubmitQuizAttemptResponse> {
    const enrollment = await this.enrollmentRepo.getById(input.enrollmentId, {
      includeCourse: false,
      includeProgressSummary: true,
    });

    if (!enrollment || enrollment.getDeletedAt()) {
      throw new EnrollmentNotFoundException("Enrollment not found");
    }
    if (
      enrollment.getStatus() === EnrollmentStatus.DROPPED ||
      enrollment.getStatus() === EnrollmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        "Cannot submit quiz for dropped or completed enrollments"
      );
    }

    const quiz = await this.quizRepo.findById(input.quizId);
    if (!quiz) {
      throw new QuizNotFoundException("Quiz not found");
    }

    const { score, maxScore } = this.evaluateQuiz(quiz, input.answers);
    const passed = score >= quiz.getPassingScore();

    const progressEntry = await this.progressRepo.findByEnrollmentIdAndQuizId(
      input.enrollmentId,
      input.quizId
    );
    if (!progressEntry) {
      throw new ProgressNotFoundException(
        `Progress entry not found for quiz ${input.quizId} in enrollment ${input.enrollmentId}`
      );
    }

    progressEntry.registerQuizAttempt(score, passed);
    const newlyCompleted = passed && !progressEntry.wasPreviouslyCompleted();

    enrollment.updateProgressEntry(progressEntry);
    await this.enrollmentRepo.upsert(enrollment);

    const milestone =
      newlyCompleted && passed
        ? {
            id: `milestone-${Date.now()}`,
            type: score === maxScore ? "QUIZ_PERFECT" : "QUIZ_PASSED",
            achievedAt: new Date().toISOString(),
          }
        : undefined;

    return {
      score,
      passed,
      completed: progressEntry.isCompleted(),
      attempts: progressEntry.getAttempts(),
      milestone,
    };
  }

  /**
   * Scores quiz answers given quiz details and submitted answers.
   * - Only supports MULTIPLE_CHOICE as of now.
   * - Each question weighted equally, 1 points per correct question, 0 for incorrect.
   * - For multiselect questions, must match exactly to score.
   */
  private evaluateQuiz(
    quiz: Quiz,
    quizAnswers: { questionId: string; answers: string[] }[]
  ): { score: number; maxScore: number } {
    const questions = quiz.getQuestions();
    const totalQuestionScore = questions.length;

    let totalScore = 0;

    for (const question of questions) {
      const answerObj = quizAnswers.find(
        (ans) => ans.questionId === question.getId()
      );
      if (!answerObj) continue; // Unanswered

      if (question.getType() !== QuestionType.MULTIPLE_CHOICE) {
        throw new NotImplementedException(
          "Only multiple choice is supported currently."
        );
      }

      if (this.isMultipleChoiceCorrect(question, answerObj.answers)) {
        totalScore += 1;
      }
    }

    // Calculate score and maxScore in percentage (0-100)
    const maxScore = 100;
    const score =
      totalQuestionScore > 0
        ? Math.round((totalScore / totalQuestionScore) * 100)
        : 0;

    return { score, maxScore };
  }

  /**
   * Checks if user's answer for a multiple choice question is correct.
   * Considers both single and multi-answer questions (order-insensitive).
   * User answers are indices in string[], corresponding to options array indices.
   */
  private isMultipleChoiceCorrect(
    question: Question,
    userAnswers: string[]
  ): boolean {
    const correctIndices: string[] = [];
    const options = question.getOptions();
    options.forEach((option, idx) => {
      if (option.isCorrect) {
        correctIndices.push(idx.toString());
      }
    });
    if (correctIndices.length === 0) return false;
    // Must match all correct indices exactly, allow no extras
    if (userAnswers.length !== correctIndices.length) return false;
    const userSet = new Set(userAnswers);
    return correctIndices.every((idx) => userSet.has(idx));
  }
}
