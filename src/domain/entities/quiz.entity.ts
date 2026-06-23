import { QuizDomainException } from "../exceptions/domain.exceptions";

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple-choice",
  TRUE_FALSE = "true-false",
  SHORT_ANSWER = "short-answer",
}

export interface QuestionOption {
  value: string;
  isCorrect: boolean;
}

export interface QuestionProps {
  id: string;
  type: QuestionType;
  point?: number;
  timeLimit?: number;
  required?: boolean;
  question: string;
  options?: QuestionOption[];
  correctAnswer: number | string | boolean | Array<number | string>;
  explanation?: string;
}

export class Question {
  private readonly id: string;
  private readonly type: QuestionType;
  private readonly point: number;
  private readonly timeLimit?: number;
  private readonly required: boolean;
  private readonly question: string;
  private readonly options?: QuestionOption[];
  private readonly correctAnswer?:
    | number
    | string
    | boolean
    | Array<number | string>;
  private readonly explanation?: string;

  constructor(props: QuestionProps) {
    if (!props.id?.trim())
      throw new QuizDomainException("Question ID is required.");
    if (!props.question?.trim())
      throw new QuizDomainException("Question text is required.");
    if (!Object.values(QuestionType).includes(props.type)) {
      throw new QuizDomainException("Invalid question type.");
    }

    this.id = props.id.trim();
    this.type = props.type;
    this.point =
      typeof props.point === "number" && props.point > 0 ? props.point : 1;
    this.timeLimit = props.timeLimit ? Number(props.timeLimit) : undefined;

    this.required = typeof props.required === "boolean" ? props.required : true;
    this.question = props.question.trim();

    if (
      this.type === QuestionType.MULTIPLE_CHOICE ||
      this.type === QuestionType.TRUE_FALSE
    ) {
      if (!props.options || props.options.length === 0) {
        throw new QuizDomainException(
          "Options required for this question type.",
        );
      }

      this.options = props.options.map((opt) => ({ ...opt }));
    }

    if (this.type === QuestionType.MULTIPLE_CHOICE) {
      if (!props.options.some((option) => option.isCorrect)) {
        throw new QuizDomainException(
          "Multiple choice question requires at least one option marked as correct . Please ensure at least one correct option is provided.",
        );
      }
    }
    if (
      this.type === QuestionType.TRUE_FALSE &&
      typeof props.correctAnswer !== "boolean"
    ) {
      throw new QuizDomainException("True/False answer must be boolean.");
    }
    if (
      this.type === QuestionType.SHORT_ANSWER &&
      typeof props.correctAnswer !== "string"
    ) {
      throw new QuizDomainException("Short answer must be string.");
    }
    this.correctAnswer = props.correctAnswer;
    this.explanation = props.explanation?.trim();
  }

  getId(): string {
    return this.id;
  }
  getType(): QuestionType {
    return this.type;
  }
  getPoint(): number {
    return this.point;
  }
  getTimeLimit(): number | undefined {
    return this.timeLimit;
  }
  isRequired(): boolean {
    return this.required;
  }
  getQuestion(): string {
    return this.question;
  }
  getOptions(): QuestionOption[] | undefined {
    return this.options ? this.options.map((o) => ({ ...o })) : undefined;
  }
  getCorrectAnswer():
    | number
    | string
    | boolean
    | Array<number | string>
    | undefined {
    return this.correctAnswer;
  }
  getExplanation(): string | undefined {
    return this.explanation;
  }

  toPrimitive(): QuestionProps {
    return {
      id: this.id,
      type: this.type,
      question: this.question,
      point: this.point,
      timeLimit: this.timeLimit,
      required: this.required,
      options: this.options
        ? this.options.map((option) => ({ ...option }))
        : undefined,
      correctAnswer: Array.isArray(this.correctAnswer)
        ? [...this.correctAnswer]
        : this.correctAnswer,
      explanation: this.explanation,
    };
  }
}

export interface QuizProps {
  id: string;
  sectionId: string;
  courseId: string;
  idempotencyKey?: string;
  title?: string;
  description?: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  questions: Question[];
  isRequired?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Quiz {
  private readonly id: string;
  private readonly sectionId: string;
  private readonly courseId: string;
  private readonly idempotencyKey?: string;

  private title?: string;
  private description?: string;
  private timeLimit?: number;
  private maxAttempts?: number;
  private passingScore: number;
  private questions: Question[];
  private isRequired: boolean;

  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  constructor(props: QuizProps) {
    if (!props.id?.trim())
      throw new QuizDomainException("Quiz ID is required.");
    if (!props.sectionId?.trim())
      throw new QuizDomainException("Section ID is required.");
    if (!props.courseId?.trim())
      throw new QuizDomainException("Course ID is required.");
    if (!Array.isArray(props.questions) || props.questions.length === 0) {
      throw new QuizDomainException("Quiz must have at least one question.");
    }
    this.id = props.id.trim();
    this.sectionId = props.sectionId.trim();
    this.courseId = props.courseId.trim();
    this.idempotencyKey = props.idempotencyKey;
    this.title = props.title?.trim();
    this.description = props.description?.trim();
    this.timeLimit = props.timeLimit;
    this.maxAttempts = props.maxAttempts;
    this.passingScore =
      typeof props.passingScore === "number" && props.passingScore > 0
        ? props.passingScore
        : 70;

    this.questions = props.questions.map((q) => q);
    this.isRequired =
      typeof props.isRequired === "boolean" ? props.isRequired : false;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
    this.deletedAt = props.deletedAt ? new Date(props.deletedAt) : undefined;
  }

  getId(): string {
    return this.id;
  }
  getSectionId(): string {
    return this.sectionId;
  }
  getCourseId(): string {
    return this.courseId;
  }
  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }
  getTitle(): string | undefined {
    return this.title;
  }
  getDescription(): string | undefined {
    return this.description;
  }
  getTimeLimit(): number | undefined {
    return this.timeLimit;
  }
  getMaxAttempts(): number | undefined {
    return this.maxAttempts;
  }
  getPassingScore(): number {
    return this.passingScore;
  }
  getQuestions(): Question[] {
    return this.questions.map((q) => q);
  }
  getIsRequired(): boolean {
    return this.isRequired;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }
  getDeletedAt(): Date | undefined {
    return this.deletedAt ? new Date(this.deletedAt) : undefined;
  }

  updateDetails(
    data: Partial<
      Omit<
        QuizProps,
        | "id"
        | "sectionId"
        | "courseId"
        | "questions"
        | "createdAt"
        | "updatedAt"
        | "deletedAt"
      >
    > & { questions?: Question[] },
  ): void {
    if (data.title !== undefined) this.title = data.title?.trim();
    if (data.description !== undefined)
      this.description = data.description?.trim();
    if (data.timeLimit !== undefined) this.timeLimit = data.timeLimit;
    if (data.maxAttempts !== undefined) this.maxAttempts = data.maxAttempts;
    if (typeof data.passingScore === "number" && data.passingScore > 0)
      this.passingScore = data.passingScore;
    if (
      data.questions !== undefined &&
      Array.isArray(data.questions) &&
      data.questions.length > 0
    ) {
      this.questions = data.questions.map((q) => q);
    }
    if (typeof data.isRequired === "boolean") this.isRequired = data.isRequired;

    this._touch();
  }

  private _touch() {
    this.updatedAt = new Date();
  }

  /**
   * Mark quiz as soft deleted (sets deletedAt, updates updatedAt)
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this._touch();
  }

  /**
   * Returns the maximum possible score (sum of question.point or 1).
   */
  getMaxScore(): number {
    if (!this.questions.length) return 0;
    return this.questions.reduce((sum, q) => sum + (q.getPoint() ?? 1), 0);
  }

  /**
   * Evaluate provided answers and return the raw score (number of points achieved).
   * Answers: array of values - each should match the correctAnswer structure for each question.
   */
  evaluateScore(answers: Array<unknown>): number {
    if (!this.questions.length || !Array.isArray(answers)) return 0;
    let score = 0;
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      const provided = answers[i];
      if (this.isAnswerCorrect(q, provided)) {
        score += q.getPoint() ?? 1;
      }
    }
    return score;
  }

  /**
   * Returns true if the answer provided matches the correct answer for the question.
   */
  private isAnswerCorrect(question: Question, provided: unknown): boolean {
    const correct = question.getCorrectAnswer();
    switch (question.getType()) {
      case QuestionType.MULTIPLE_CHOICE:
        if (Array.isArray(correct)) {
          if (!Array.isArray(provided)) return false;
          const corrSorted = correct.map(String).sort();
          const provSorted = (provided as Array<unknown>).map(String).sort();
          return (
            corrSorted.length === provSorted.length &&
            corrSorted.every((v, idx) => v === provSorted[idx])
          );
        }
        return typeof provided === "number" && provided === correct;
      case QuestionType.TRUE_FALSE:
        return typeof provided === "boolean" && provided === correct;
      case QuestionType.SHORT_ANSWER:
        return (
          typeof provided === "string" &&
          typeof correct === "string" &&
          provided.trim().toLowerCase() === correct.trim().toLowerCase()
        );
      default:
        return false;
    }
  }

  /**
   * Returns score as a percentage (0-100), rounded to 2 decimals.
   */
  evaluatePercentage(answers: Array<unknown>): number {
    const max = this.getMaxScore();
    if (max <= 0) return 0;
    const raw = this.evaluateScore(answers);
    return Math.round((raw / max) * 10000) / 100;
  }

  /**
   * Returns whether the score is passing for this quiz.
   */
  isPassing(scoreOrPercentage: number, isPercentage = false): boolean {
    if (this.passingScore <= 0) return false;
    if (isPercentage) return scoreOrPercentage >= this.passingScore;
    const max = this.getMaxScore();
    if (max <= 0) return false;
    const percent = (scoreOrPercentage / max) * 100;
    return percent >= this.passingScore;
  }

  /**
   * Returns quiz meta: max score, passing percent, and question count.
   */
  getMeta() {
    return {
      maxScore: this.getMaxScore(),
      passingScorePercent: this.passingScore,
      questionCount: this.questions.length,
    };
  }

  toPrimitive() {
    return {
      id: this.id,
      sectionId: this.sectionId,
      courseId: this.courseId,
      idempotencyKey: this.idempotencyKey,
      title: this.title,
      description: this.description,
      timeLimit: this.timeLimit,
      maxAttempts: this.maxAttempts,
      passingScore: this.passingScore,
      questions: this.questions?.map((q) => q.toPrimitive()),
      isRequired: this.isRequired,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
