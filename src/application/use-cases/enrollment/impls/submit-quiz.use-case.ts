import { Injectable } from "@nestjs/common";
import { EnrollmentNotFoundException } from "src/domain/exceptions/enrollment.exceptions";
import { QuizNotFoundException } from "src/domain/exceptions/quiz.exceptions";
import { IEnrollmentRepository } from "src/domain/repositories/enrollment.repository";
import { IQuizRepository } from "src/domain/repositories/quiz.repository";
import { UnauthorizedException } from "src/shared/exceptions/infra.exceptions";
import { ISubmitQuizUseCase } from "../interfaces/submit-quiz.interface";

export interface SubmitQuizCommandDTO {
  enrollmentId: string;
  quizId: string;
  userId: string;
  score: number;
}

export interface SubmitQuizResultDTO {
  enrollmentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  progressPercent: number;
  status: string;
  completedAt?: Date;
}

@Injectable()
export class SubmitQuizUseCase implements ISubmitQuizUseCase {
  constructor(
    private readonly _enrollmentRepo: IEnrollmentRepository,
    private readonly _quizRepo: IQuizRepository,
  ) {}

  async execute(cmd: SubmitQuizCommandDTO): Promise<SubmitQuizResultDTO> {
    const enrollment = await this._enrollmentRepo.findById(cmd.enrollmentId, {
      includeCourse: false,
      includeProgressSummary: true,
    });

    if (!enrollment) {
      throw new EnrollmentNotFoundException("Enrollment not found");
    }
    if (enrollment.getStudentId() !== cmd.userId) {
      throw new UnauthorizedException();
    }

    const quiz = await this._quizRepo.findById(cmd.quizId);

    if (!quiz) {
      throw new QuizNotFoundException("Quiz not found");
    }

    const passingScore = quiz.getPassingScore() ?? 0;
    const requirePassingScore = quiz.getIsRequired() ?? true;

    const passed = cmd.score >= passingScore;

    enrollment.completeQuiz(
      quiz.getId(),
      cmd.score,
      passed,
      requirePassingScore,
    );

    await this._enrollmentRepo.upsert(enrollment);

    return {
      enrollmentId: enrollment.getId(),
      quizId: quiz.getId(),
      score: cmd.score,
      passed,
      progressPercent: enrollment.getProgressPercent(),
      status: enrollment.getStatus(),
      completedAt: enrollment.getCompletedAt(),
    };
  }
}
