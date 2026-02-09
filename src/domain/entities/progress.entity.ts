import { ProgressDomainException } from "../exceptions/domain.exceptions";

export enum UnitType {
  LESSON = "lesson",
  QUIZ = "quiz",
}

export interface ProgressPrimitive {
  id: string;
  enrollmentId: string;
  lessonId?: string;
  quizId?: string;
  unitType: UnitType;
  completed: boolean;
  score?: number;
  attempts: number;
  watchTime: number;
  duration: number;
  completedAt?: string; 
  passed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export class Progress {
  private previousCompleted = false;

  private readonly id: string;
  private readonly enrollmentId: string;
  private readonly lessonId?: string;
  private readonly quizId?: string;
  private readonly unitType: UnitType;
  private completed: boolean;
  private score?: number;
  private attempts: number;
  private watchTime: number;
  private duration: number;
  private completedAt?: Date;
  private passed?: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  constructor(
    id: string,
    enrollmentId: string,
    lessonId: string | undefined,
    quizId: string | undefined,
    unitType: UnitType,
    completed = false,
    score?: number,
    attempts = 0,
    watchTime = 0,
    duration = 0,
    completedAt?: Date,
    passed?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date
  ) {
    this.id = id;
    this.enrollmentId = enrollmentId;
    this.lessonId = lessonId;
    this.quizId = quizId;
    this.unitType = unitType;
    this.completed = completed;
    this.score = score ? Number(score) : undefined;
    this.attempts = Number(attempts);
    this.watchTime = Number(watchTime);
    this.duration = Number(duration);
    this.completedAt = completedAt ? new Date(completedAt) : undefined;
    this.passed = passed;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.deletedAt = deletedAt ? new Date(deletedAt) : undefined;
  }

  
  getId(): string {
    return this.id;
  }
  getEnrollmentId(): string {
    return this.enrollmentId;
  }

  getUnitId(): string | undefined {
    return this.isLesson()
      ? this.lessonId
      : this.isQuiz()
        ? this.quizId
        : undefined;
  }
  getLessonId(): string | undefined {
    return this.lessonId;
  }
  getQuizId(): string | undefined {
    return this.quizId;
  }
  getUnitType(): UnitType {
    return this.unitType;
  }
  getCompleted(): boolean {
    return this.completed;
  }
  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }
  getScore(): number | undefined {
    return this.score;
  }
  getAttempts(): number {
    return this.attempts;
  }
  getWatchTime(): number {
    return this.watchTime;
  }
  getDuration(): number {
    return this.duration;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getPassed(): boolean | undefined {
    return this.passed;
  }
  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isLesson(): boolean {
    return this.unitType === UnitType.LESSON;
  }
  isQuiz(): boolean {
    return this.unitType === UnitType.QUIZ;
  }

  

  markLessonCompleted(): void {
    if (!this.isLesson()) return;
    if (this.completed) return;
    this.completed = true;
    this.completedAt = new Date();
    this._touch();
  }

  /**
   * @param score - quiz score
   * @param passed - whether quiz passed
   * @param requirePassingScore - if true, quiz counts as completed only if passed; otherwise any submission counts as completed
   */
  markQuizCompleted(
    score: number,
    passed: boolean,
    requirePassingScore: boolean
  ): void {
    if (!this.isQuiz()) return;

    
    if (this.completed && this.passed === passed) return;

    this.score = score;
    this.passed = passed;

    if (requirePassingScore) {
      this.completed = passed;
    } else {
      this.completed = true;
    }

    this.completedAt = new Date();
    this._touch();
  }


  updateWatchProgress(
    currentTimeSeconds: number,
    durationSeconds: number,
    treatAsAbsolute = true
  ): void {
    if (!this.isLesson()) {
      throw new ProgressDomainException("updateWatchProgress called on non-lesson progress");
    }

    this.previousCompleted = this.completed;

    if (treatAsAbsolute) {
      this.watchTime = Math.max(this.watchTime, Math.floor(currentTimeSeconds));
    } else {
      this.watchTime = Math.max(
        0,
        this.watchTime + Math.floor(currentTimeSeconds)
      );
    }
    if (durationSeconds && durationSeconds > 0) {
      this.duration = Math.floor(durationSeconds);
    }

    const percent = this.getProgressPercent();

    
    const COMPLETION_PERCENT = 80;

    if (!this.completed && percent >= COMPLETION_PERCENT) {
      this.completed = true;
      this.completedAt = new Date();
    }

    this._touch();
  }

  private _touch() {
    this.updatedAt = new Date();
  }

  
  registerQuizAttempt(rawScore: number, passed: boolean): void {
    if (!this.isQuiz()) {
      throw new ProgressDomainException("registerQuizAttempt called on non-quiz progress");
    }

    this.previousCompleted = this.completed;

    this.attempts = (this.attempts ?? 0) + 1;
    this.score = Math.max(this.score ?? 0, rawScore); 
    if (passed && !this.completed) {
      this.completed = true;
      this.completedAt = new Date();
    }
    this._touch();
  }

 
  getProgressPercent(maxQuizScore?: number): number {
    if (this.isLesson()) {
      if (!this.duration || this.duration <= 0) return 0;
      const percent = (this.watchTime / this.duration) * 100;
      return Math.min(100, Math.round(percent * 100) / 100); 
    } else {
      if (maxQuizScore && maxQuizScore > 0 && this.score !== undefined) {
        const percent = (this.score / maxQuizScore) * 100;
        return Math.min(100, Math.round(percent * 100) / 100);
      }
      return this.score !== undefined ? this.score : 0;
    }
  }


  wasPreviouslyCompleted(): boolean {
    return !!this.previousCompleted;
  }

 
  isCompleted(): boolean {
    return !!this.completed;
  }

  softDelete(): void {
    if (this.deletedAt) return;
    this.deletedAt = new Date();
    this._touch();
  }

 
  toPrimitive(): ProgressPrimitive {
    return {
      id: this.id,
      enrollmentId: this.enrollmentId,
      lessonId: this.lessonId,
      quizId: this.quizId,
      unitType: this.unitType,
      completed: this.completed,
      score: this.score,
      attempts: this.attempts,
      watchTime: this.watchTime,
      duration: this.duration,
      completedAt: this.completedAt?.toISOString(),
      passed: this.passed,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      deletedAt: this.deletedAt?.toISOString(),
    };
  }


  static fromPrimitive(primitive: ProgressPrimitive): Progress {
    return new Progress(
      primitive.id,
      primitive.enrollmentId,
      primitive.lessonId,
      primitive.quizId,
      primitive.unitType,
      primitive.completed,
      primitive.score,
      primitive.attempts,
      primitive.watchTime,
      primitive.duration,
      primitive.completedAt ? new Date(primitive.completedAt) : undefined,
      primitive.passed,
      primitive.createdAt ? new Date(primitive.createdAt) : undefined,
      primitive.updatedAt ? new Date(primitive.updatedAt) : undefined,
      primitive.deletedAt ? new Date(primitive.deletedAt) : undefined
    );
  }
}
