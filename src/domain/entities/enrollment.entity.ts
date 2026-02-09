import {
  EnrollmentDomainException,
  ProgressNotFoundException,
} from "../exceptions/domain.exceptions";
import { Course } from "./course.entity";
import { UnitType, Progress } from "./progress.entity";

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
}

// type MilestoneType =
//   | 'LESSON_COMPLETED'
//   | 'QUIZ_PASSED'
//   | 'QUIZ_PERFECT'
//   | 'COURSE_COMPLETED';

// interface Milestone {
//   id: string;
//   type: MilestoneType;
//   achievedAt: string;
//   metadata?: Record<string, any>;
// }

export class Enrollment {
  private course?: Course;
  constructor(
    private readonly id: string,
    private readonly studentId: string,
    private readonly courseId: string,
    private readonly orderId: string,
    private readonly instructorId: string,
    private idempotencyKey?: string,
    private readonly enrolledAt?: Date,
    private status: EnrollmentStatus = EnrollmentStatus.ACTIVE,
    private progressPercent: number = 0,
    private completedAt?: Date,
    private createdAt?: Date,
    private updatedAt?: Date,
    private deletedAt?: Date,
    private progressEntries: Progress[] = [],
    private totalLearningUnits: number = 0,
    private completedLearningUnits: number = 0,
    // private milestones: Milestone[] = [],
  ) {
    this.completedAt = completedAt ? new Date(completedAt) : undefined;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.enrolledAt = enrolledAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.deletedAt = deletedAt ? new Date(updatedAt) : undefined;
  }

  getId(): string {
    return this.id;
  }

  getStudentId(): string {
    return this.studentId;
  }
  getInstructorId(): string {
    return this.instructorId;
  }

  getCourseId(): string {
    return this.courseId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }

  getEnrolledAt(): Date {
    return this.enrolledAt;
  }

  getStatus(): EnrollmentStatus {
    return this.status;
  }

  getProgressPercent(): number {
    return this.progressPercent;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
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
  getCourse(): Course | undefined {
    return this.course;
  }

  getProgressEntries(): ReadonlyArray<Progress> {
    return this.progressEntries;
  }

  getTotalLearningUnits(): number {
    return this.totalLearningUnits;
  }

  getCompletedLearningUnits(): number {
    return this.completedLearningUnits;
  }

  setCourse(course: Course) {
    this.course = course;
  }

  attachProgress(entries: Progress[]): void {
    this.progressEntries = entries;
    this.totalLearningUnits = entries.filter((e) => !e.getDeletedAt()).length;
    this.completedLearningUnits = entries.filter(
      (e) => !e.getDeletedAt() && e.isCompleted(),
    ).length;
    this.recalculateProgressPercent();
  }

  updateProgressEntry(progress: Progress): void {
    if (progress.getEnrollmentId() !== this.id) {
      throw new EnrollmentDomainException("Progress enrollment mismatch");
    }

    const idx = this.progressEntries.findIndex(
      (p) =>
        p.getUnitId() === progress.getUnitId() &&
        p.getUnitType() === progress.getUnitType(),
    );

    const wasPreviouslyCompleted =
      idx >= 0 ? this.progressEntries[idx].isCompleted() : false;

    if (idx >= 0) {
      this.progressEntries[idx] = progress;
    } else {
      // Insert new
      this.progressEntries.push(progress);
      if (!progress.getDeletedAt()) {
        this.totalLearningUnits += 1;
      }
    }

    const nowCompleted = progress.isCompleted();

    if (!wasPreviouslyCompleted && nowCompleted) {
      this.completedLearningUnits += 1;
    } else if (wasPreviouslyCompleted && !nowCompleted) {
      this.completedLearningUnits = Math.max(
        0,
        this.completedLearningUnits - 1,
      );
    }

    this.afterUnitCompletionChanged();
  }

  completeLesson(lessonId: string): void {
    const entry = this.progressEntries.find(
      (p) =>
        p.getUnitId() === lessonId &&
        p.getUnitType() === UnitType.LESSON &&
        !p.getDeletedAt(),
    );
    if (!entry) {
      throw new ProgressNotFoundException(
        `Lesson progress not found for lesson ${lessonId}`,
      );
    }

    const wasCompleted = entry.isCompleted();
    entry.markLessonCompleted();

    if (!wasCompleted && entry.isCompleted()) {
      this.completedLearningUnits += 1;
      this.afterUnitCompletionChanged();
    } else {
      this.touch();
    }
  }

  completeQuiz(
    quizId: string,
    score: number,
    passed: boolean,
    requirePassingScore: boolean,
  ): void {
    const entry = this.progressEntries.find(
      (p) =>
        p.getUnitId() === quizId &&
        p.getUnitType() === UnitType.QUIZ &&
        !p.getDeletedAt(),
    );
    if (!entry) {
      throw new ProgressNotFoundException(
        `Quiz progress not found for quiz ${quizId}`,
      );
    }

    const wasCompleted = entry.isCompleted();
    entry.markQuizCompleted(score, passed, requirePassingScore);

    if (!wasCompleted && entry.isCompleted()) {
      this.completedLearningUnits += 1;
      this.afterUnitCompletionChanged();
    } else {
      this.touch();
    }
  }

  updateStatus(status: EnrollmentStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.touch();
  }

  softDelete(): void {
    if (this.deletedAt) return;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.progressEntries.forEach((p) => p.softDelete());
  }


  // getMilestones(): ReadonlyArray<Milestone> {
  //   return this.milestones.slice();
  // }

 
  // registerLessonCompletedMilestone(lessonId: string): void {
  //   const already = this.milestones.some(
  //     (m) => m.type === 'LESSON_COMPLETED' && m.metadata?.lessonId === lessonId,
  //   );
  //   if (already) return;
  //   this.pushMilestone({
  //     id: `milestone-${Date.now()}-${lessonId}`,
  //     type: 'LESSON_COMPLETED',
  //     achievedAt: new Date().toISOString(),
  //     metadata: { lessonId },
  //   });
  // }

  /**
   * Register a milestone for quiz pass, if not already present.
   */
  // registerQuizPassedMilestone(quizId: string, score: number): void {
  //   const already = this.milestones.some(
  //     (m) => m.type === 'QUIZ_PASSED' && m.metadata?.quizId === quizId,
  //   );
  //   if (already) return;
  //   this.pushMilestone({
  //     id: `milestone-${Date.now()}-${quizId}`,
  //     type: 'QUIZ_PASSED',
  //     achievedAt: new Date().toISOString(),
  //     metadata: { quizId, score },
  //   });
  // }

  /**
   * Register a perfect quiz score milestone.
   */
  // registerPerfectQuizMilestone(quizId: string): void {
  //   const already = this.milestones.some(
  //     (m) => m.type === 'QUIZ_PERFECT' && m.metadata?.quizId === quizId,
  //   );
  //   if (already) return;
  //   this.pushMilestone({
  //     id: `milestone-${Date.now()}-perfect-${quizId}`,
  //     type: 'QUIZ_PERFECT',
  //     achievedAt: new Date().toISOString(),
  //     metadata: { quizId },
  //   });
  // }

  // private pushMilestone(m: Milestone): void {
  //   this.milestones.push(m);
  //   this.touch();
  // }

  private afterUnitCompletionChanged(): void {
    this.recalculateProgressPercent();

    if (
      this.completedLearningUnits === this.totalLearningUnits &&
      this.totalLearningUnits > 0 &&
      this.status !== EnrollmentStatus.COMPLETED
    ) {
      this.markAsCompleted();
      // Register course completion milestone if not already present
      // const hasCourseMilestone = this.milestones.some(
      //   (mm) => mm.type === 'COURSE_COMPLETED',
      // );
      // if (!hasCourseMilestone) {
      //   this.pushMilestone({
      //     id: `milestone-course-${Date.now()}`,
      //     type: 'COURSE_COMPLETED',
      //     achievedAt: new Date().toISOString(),
      //     metadata: { courseId: this.courseId },
      //   });
      // }
    } else {
      this.touch();
    }
  }

  private markAsCompleted(): void {
    this.status = EnrollmentStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  private recalculateProgressPercent(): void {
    if (this.totalLearningUnits === 0) {
      this.progressPercent = 0;
      return;
    }
    const percent =
      (this.completedLearningUnits / this.totalLearningUnits) * 100;
    this.progressPercent = Math.min(100, Math.round(percent * 100) / 100);
    this.updatedAt = new Date();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
