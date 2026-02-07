import { SectionDomainException } from "../exceptions/domain.exceptions";
import { Lesson } from "./lesson.entity";
import { Quiz } from "./quiz.entity";

export interface SectionProps {
  id: string;
  courseId: string;
  title: string;
  idempotencyKey?: string;
  order?: number;
  description?: string;
  isPublished?: boolean;
  lessons?: Lesson[];
  quiz?: Quiz;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Section {
  private readonly id: string;
  private readonly courseId: string;
  private readonly idempotencyKey?: string;

  private title: string;
  private order: number;
  private description?: string;
  private isPublished: boolean;
  private lessons: Lesson[];
  private quiz?: Quiz;

  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  constructor(props: SectionProps) {
    if (!props.id?.trim())
      throw new SectionDomainException("Section ID is required.");
    if (!props.courseId?.trim())
      throw new SectionDomainException("Course ID is required.");
    if (!props.title?.trim())
      throw new SectionDomainException("Section title is required.");

    this.id = props.id;
    this.courseId = props.courseId;
    this.title = props.title.trim();
    this.idempotencyKey = props.idempotencyKey;
    this.order = props.order ?? 0;
    this.description = props.description?.trim();
    this.isPublished = props.isPublished ?? false;
    this.lessons = props.lessons ? props.lessons.slice() : [];
    this.quiz = props.quiz;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
    this.deletedAt = props.deletedAt ? new Date(props.deletedAt) : undefined;
  }

  getId(): string {
    return this.id;
  }
  getCourseId(): string {
    return this.courseId;
  }
  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }
  getTitle(): string {
    return this.title;
  }
  getOrder(): number {
    return this.order;
  }
  getDescription(): string | undefined {
    return this.description;
  }
  getIsPublished(): boolean {
    return this.isPublished;
  }
  getLessons(): Lesson[] {
    return [...this.lessons];
  }
  getQuiz(): Quiz | undefined {
    return this.quiz;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  updateDetails(
    details: Partial<
      Pick<SectionProps, "title" | "order" | "description" | "isPublished">
    >,
  ): void {
    if (details.title !== undefined && details.title.trim().length > 0) {
      this.title = details.title.trim();
    }
    if (details.order !== undefined) {
      this.order = details.order;
    }
    if ("description" in details) {
      this.description = details.description?.trim();
    }
    if ("isPublished" in details && details.isPublished !== undefined) {
      this.isPublished = details.isPublished;
    }

    this._touch();
  }

  private _touch() {
    this.updatedAt = new Date();
  }

  publish(): void {
    if (this.isPublished) return;
    this.isPublished = true;

    this._touch();
  }

  unpublish(): void {
    if (!this.isPublished) return;
    this.isPublished = false;

    this._touch();
  }

  softDelete(): void {
    if (this.deletedAt) return;
    this.deletedAt = new Date();

    this._touch();
  }

  restore(): void {
    if (!this.deletedAt) return;
    this.deletedAt = undefined;

    this._touch();
  }

  addQuiz(quiz: Quiz): void {
    if (!quiz) throw new SectionDomainException("Quiz is required.");
    this.quiz = quiz;

    this._touch();
  }

  removeQuiz(): void {
    if (!this.quiz) return;
    this.quiz = undefined;

    this._touch();
  }

  addLesson(lesson: Lesson): void {
    if (!lesson) throw new SectionDomainException("Lesson is required.");
    if (this.lessons.some((l) => l.getId() === lesson.getId())) {
      throw new SectionDomainException(
        "Lesson with this ID already exists in this section.",
      );
    }
    this.lessons = [...this.lessons, lesson];

    this._touch();
  }

  removeLesson(lessonId: string): void {
    const idx = this.lessons.findIndex((l) => l.getId() === lessonId);
    if (idx === -1) throw new SectionDomainException("Lesson not found.");
    this.lessons = this.lessons.filter((l) => l.getId() !== lessonId);

    this._touch();
  }

  updateLesson(updatedLesson: Lesson): void {
    const idx = this.lessons.findIndex(
      (l) => l.getId() === updatedLesson.getId(),
    );
    if (idx === -1)
      throw new SectionDomainException("Lesson not found in this section.");
    this.lessons = this.lessons.map((l) =>
      l.getId() === updatedLesson.getId() ? updatedLesson : l,
    );

    this._touch();
  }

  toPrimitive() {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      idempotencyKey: this.idempotencyKey,
      order: this.order,
      description: this.description,
      isPublished: this.isPublished,
      lessons: this.lessons.map((lesson) => lesson.toPrimitive()),
      quiz: this.quiz ? this.quiz.toPrimitive() : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
