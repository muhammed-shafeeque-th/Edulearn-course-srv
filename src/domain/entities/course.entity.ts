import { Section } from "./section.entity";
import { User } from "./user.entity";
import { CourseDomainException } from "../exceptions/domain.exceptions";

export type UserMeta = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
};
export interface CourseMetadata {
  id: string;
  title: string;
  topics: string[];
  instructorId: string;
  subTitle: string;
  category: string;
  subCategory: string;
  language: string;
  subtitleLanguage: string;
  level: string;
  durationValue: string;
  durationUnit: string;
  description?: string | undefined;
  learningOutcomes: string[];
  targetAudience: string[];
  requirements: string[];
  thumbnail?: string | undefined;
  trailer?: string | undefined;
  status: string;
  slug: string;
  rating: number;
  numberOfRating: number;
  students: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | undefined;
  price?: number | undefined;
  noOfLessons: number;
  noOfSections: number;
  noOfQuizzes: number;
  discountPrice?: number | undefined;
  currency?: string | undefined;
  instructor: UserMeta | User | undefined;
}

export enum CourseStatus {
  PUBLISHED = "published",
  DRAFT = "draft",
  DELETED = "deleted",
  UNPUBLISHED = "unpublished",
}

export interface CourseDetails {
  title?: string;
  slug?: string;
  subTitle?: string;
  category?: string;
  subCategory?: string;
  courseLanguage?: string;
  subtitleLanguage?: string;
  level?: string;
  topics?: string[];
  duration?: number;
  durationUnit?: string;
  description?: string;
  thumbnail?: string;
  trailer?: string;
  discountPrice?: number;
  price?: number;
  currency?: string;
  learningOutcomes?: string[];
  targetAudience?: string[];
  requirements?: string[];
}

interface CourseOptions {
  numberOfRatings?: number;
  rating?: number;
  students?: number;
  totalLessonCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
interface CourseProps {
  id: string;
  instructor: User;
  instructorId: string;
  idempotencyKey: string;
  details: CourseDetails;
  status?: CourseStatus;
  options?: CourseOptions;
  sections?: Section[];
}

export class Course {
  private readonly id: string;
  private instructor: User;
  private instructorId: string;
  private idempotencyKey?: string;
  private title: string;
  private slug: string;
  private subTitle?: string;
  private category?: string;
  private subCategory?: string;
  private courseLanguage?: string;
  private subtitleLanguage?: string;
  private level?: string;
  private topics: string[] = [];
  private duration?: number;
  private durationUnit?: string;
  private description?: string;
  private status: CourseStatus;
  private thumbnail?: string;
  private trailer?: string;
  private learningOutcomes: string[] = [];
  private targetAudience: string[] = [];
  private courseRequirements: string[] = [];
  private price?: number;
  private discountPrice?: number;
  private currency?: string;
  private numberOfRatings: number = 0;
  private totalLessonCount: number = 0;
  private rating: number = 0;
  private students: number = 0;
  private sections: Section[] = [];
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  /**
   * Create a new Course aggregate.
   */
  constructor(props: CourseProps) {
    if (!props.details.title?.trim())
      throw new CourseDomainException("Course title is required.");
    if (!props.details.slug?.trim())
      throw new CourseDomainException("Course slug is required.");
    this.id = props.id;
    this.instructor = props.instructor;
    this.instructorId = props.instructorId;
    this.status = props.status ?? CourseStatus.DRAFT;
    this.idempotencyKey = props.idempotencyKey;
    this.sections = props.sections ?? [];
    this.createdAt = props.options?.createdAt
      ? new Date(props.options.createdAt)
      : new Date();
    this.updatedAt = props.options?.updatedAt
      ? new Date(props.options.updatedAt)
      : new Date();
    this.deletedAt = props.options?.deletedAt
      ? new Date(props.options.deletedAt)
      : undefined;
    this.numberOfRatings = props.options?.numberOfRatings
      ? Number(props.options?.numberOfRatings)
      : 0;
    this.rating = props.options?.rating ? Number(props.options.rating) : 0;
    this.students = props.options?.students
      ? Number(props.options.students)
      : 0;
    this.totalLessonCount = props.options?.totalLessonCount
      ? Number(props.options.totalLessonCount)
      : 0;

    this.applyDetails(props.details);
  }

  getId(): string {
    return this.id;
  }
  getInstructor(): User {
    return this.instructor;
  }
  getInstructorId(): string {
    return this.instructorId;
  }
  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }
  getTitle(): string {
    return this.title;
  }
  getSlug(): string {
    return this.slug;
  }
  getSubTitle(): string | undefined {
    return this.subTitle;
  }
  getCategory(): string | undefined {
    return this.category;
  }
  getSubCategory(): string | undefined {
    return this.subCategory;
  }
  getCourseLanguage(): string | undefined {
    return this.courseLanguage;
  }
  getSubtitleLanguage(): string | undefined {
    return this.subtitleLanguage;
  }
  getLevel(): string | undefined {
    return this.level;
  }
  getTopics(): string[] {
    return [...this.topics];
  }
  getDuration(): number | undefined {
    return this.duration;
  }
  getDurationUnit(): string | undefined {
    return this.durationUnit;
  }
  getDescription(): string | undefined {
    return this.description;
  }
  getStatus(): CourseStatus {
    return this.status;
  }
  getThumbnail(): string | undefined {
    return this.thumbnail;
  }
  getTrailer(): string | undefined {
    return this.trailer;
  }
  getLearningOutcomes(): string[] {
    return [...this.learningOutcomes];
  }
  /** @deprecated Use getLearningOutcomes() instead */
  getWhatYouWillLearn(): string[] {
    return [...this.learningOutcomes];
  }
  getTargetAudience(): string[] {
    return [...this.targetAudience];
  }
  getCourseRequirements(): string[] {
    return [...this.courseRequirements];
  }
  getPrice(): number | undefined {
    return this.price;
  }
  getDiscountPrice(): number | undefined {
    return this.discountPrice;
  }
  getCurrency(): string | undefined {
    return this.currency;
  }
  getRating(): number {
    return this.rating;
  }
  getNumberOfRatings(): number {
    return this.numberOfRatings;
  }
  getStudents(): number {
    return this.students;
  }
  getTotalLessonCount(): number {
    return this.totalLessonCount;
  }
  getSections(): Section[] {
    return [...this.sections];
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

  // =================== Validation & Lifecycle Methods ===================

  /**
   * Checks if the course can be published.
   */
  public canBePublished(): boolean {
    // Title and slug checks redundant here (enforced at construction)
    if (
      !this.sections ||
      !Array.isArray(this.sections) ||
      this.sections.length === 0
    )
      return false;
    if (!this.hasAtLeastOneLesson()) return false;
    if (typeof this.price !== "number" || this.price <= 0) return false;
    if (!this.thumbnail || !this.thumbnail.trim()) return false;
    return true;
  }

  public hasAtLeastOneSection(): boolean {
    return Array.isArray(this.sections) && this.sections.length > 0;
  }

  public hasAtLeastOneLesson(): boolean {
    if (!Array.isArray(this.sections) || this.sections.length === 0)
      return false;
    return this.sections.some((section: Section) => {
      const lessons = section.getLessons?.();
      return Array.isArray(lessons) && lessons.length > 0;
    });
  }

  public hasPrice(): boolean {
    return typeof this.price === "number" && this.price > 0;
  }

  public hasThumbnail(): boolean {
    return typeof this.thumbnail === "string" && this.thumbnail.trim() !== "";
  }

  public updateDetails(details: CourseDetails): void {
    this.applyDetails(details);
    this.touch();
  }

  private applyDetails(details: CourseDetails): void {
    if (details.title !== undefined) this.title = details.title;
    if (details.slug !== undefined) this.slug = details.slug;
    if (details.subTitle !== undefined) this.subTitle = details.subTitle;
    if (details.category !== undefined) this.category = details.category;
    if (details.subCategory !== undefined)
      this.subCategory = details.subCategory;
    if (details.courseLanguage !== undefined)
      this.courseLanguage = details.courseLanguage;
    if (details.subtitleLanguage !== undefined)
      this.subtitleLanguage = details.subtitleLanguage;
    if (details.level !== undefined) this.level = details.level;
    if (details.topics !== undefined) this.topics = [...details.topics];
    if (details.duration !== undefined) this.duration = details.duration;
    if (details.durationUnit !== undefined)
      this.durationUnit = details.durationUnit;
    if (details.description !== undefined)
      this.description = details.description;
    if (details.thumbnail !== undefined) this.thumbnail = details.thumbnail;
    if (details.trailer !== undefined) this.trailer = details.trailer;
    if (details.discountPrice !== undefined)
      this.discountPrice = Number(details.discountPrice);
    if (details.price !== undefined) this.price = Number(details.price);
    if (details.currency !== undefined) this.currency = details.currency;
    if (details.learningOutcomes !== undefined)
      this.learningOutcomes = [...details.learningOutcomes];
    if (details.targetAudience !== undefined)
      this.targetAudience = [...details.targetAudience];
    if (details.requirements !== undefined)
      this.courseRequirements = [...details.requirements];
  }

  public publishCourse(): void {
    if (this.status === CourseStatus.PUBLISHED) return;

    // Compose validation
    if (!this.canBePublished()) {
      const reasons: string[] = [];
      if (!this.hasAtLeastOneSection())
        reasons.push("Course must have at least one section.");
      if (!this.hasAtLeastOneLesson())
        reasons.push("Course must have at least one lesson.");
      if (!this.hasPrice())
        reasons.push("Course price must be set and greater than zero.");
      if (!this.hasThumbnail()) reasons.push("Course must have a thumbnail.");
      throw new CourseDomainException(
        "Course is incomplete: " + reasons.join(" "),
      );
    }

    this.status = CourseStatus.PUBLISHED;
    this.touch();
  }

  /**
   * Mark course as draft.
   */
  public draftCourse(): void {
    if (this.status === CourseStatus.DRAFT) return;
    if (this.status === CourseStatus.DELETED) {
      throw new CourseDomainException(
        "Cannot mark a deleted course as draft. Please restore it first.",
      );
    }
    this.status = CourseStatus.DRAFT;
    this.touch();
  }

  /**
   * Unpublish the course. Sets status to UNPUBLISHED.
   */
  public unpublishCourse(): void {
    if (this.status !== CourseStatus.PUBLISHED) {
      throw new CourseDomainException(
        "Only a published course can be unpublished.",
      );
    }
    this.status = CourseStatus.UNPUBLISHED;
    this.touch();
  }

  public softDelete(): void {
    if (this.status === CourseStatus.DELETED) return;
    this.status = CourseStatus.DELETED;
    this.deletedAt = new Date();
    this.touch();
  }

  /**
   * Restore soft-deleted course and set status to draft.
   */
  public restore(): void {
    if (this.status !== CourseStatus.DELETED) {
      throw new CourseDomainException(
        "Can only restore a course that has been deleted.",
      );
    }
    this.status = CourseStatus.DRAFT;
    this.deletedAt = undefined;
    this.touch();
  }

  /**
   * Add a new section to course (must be unique).
   */
  public addSection(section: Section): void {
    if (!section) throw new CourseDomainException("Section is required.");
    if (this.sections.some((s) => s.getId() === section.getId())) {
      throw new CourseDomainException(
        "Section with this ID already exists in this course.",
      );
    }
    this.sections.push(section);
    // Keep totalLessonCount up-to-date (null safety for getLessons)
    if (typeof section.getLessons === "function") {
      const l = section.getLessons();
      this.totalLessonCount += Array.isArray(l) ? l.length : 0;
    }
    this.touch();
  }

  public removeSection(sectionId: string): void {
    const idx = this.sections.findIndex((s) => s.getId() === sectionId);
    if (idx === -1) throw new CourseDomainException("Section not found.");
    const removed = this.sections.splice(idx, 1)[0];
    if (typeof removed.getLessons === "function") {
      const l = removed.getLessons();
      this.totalLessonCount -= Array.isArray(l) ? l.length : 0;
      if (this.totalLessonCount < 0) this.totalLessonCount = 0;
    }
    this.touch();
  }

  public updateSection(updatedSection: Section): void {
    const idx = this.sections.findIndex(
      (s) => s.getId() === updatedSection.getId(),
    );
    if (idx === -1) throw new CourseDomainException("Section not found.");

    // Adjust totalLessonCount correctly
    if (typeof this.sections[idx].getLessons === "function") {
      const l = this.sections[idx].getLessons();
      this.totalLessonCount -= Array.isArray(l) ? l.length : 0;
    }
    this.sections[idx] = updatedSection;
    if (typeof updatedSection.getLessons === "function") {
      const l = updatedSection.getLessons();
      this.totalLessonCount += Array.isArray(l) ? l.length : 0;
    }
    this.touch();
  }

  public setTotalLessonsCount(count: number): void {
    if (count < 0) throw new CourseDomainException("Lesson count must be >= 0");
    this.totalLessonCount = count;
    this.touch();
  }

  public updateSlug(slug: string): void {
    if (!slug?.trim())
      throw new CourseDomainException("Slug must be non-empty.");
    this.slug = slug;
    this.touch();
  }

  public incrementEnrollment(n = 1): void {
    if (n < 0)
      throw new CourseDomainException(
        "Cannot increment student count by negative number",
      );
    this.students += n;
    this.touch();
  }

  public decrementEnrollment(n = 1): void {
    if (n < 0)
      throw new CourseDomainException(
        "Cannot decrement student count by negative number",
      );
    this.students = Math.max(0, this.students - n);
    this.touch();
  }

  public rateCourse(newRate: number): void {
    if (!Number.isInteger(newRate) || newRate < 1 || newRate > 5) {
      throw new CourseDomainException(
        "Rating should be integer between 1 and 5.",
      );
    }
    const totalRates = this.rating * this.numberOfRatings + newRate;
    this.numberOfRatings++;
    this.rating = Number((totalRates / this.numberOfRatings).toFixed(1));
    this.touch();
  }

  public changeRating(previousRate: number, newRate: number): void {
    if (
      !Number.isInteger(previousRate) ||
      previousRate < 1 ||
      previousRate > 5
    ) {
      throw new CourseDomainException(
        "Previous rating should be integer between 1 and 5.",
      );
    }
    if (!Number.isInteger(newRate) || newRate < 1 || newRate > 5) {
      throw new CourseDomainException(
        "New rating should be integer between 1 and 5.",
      );
    }
    if (this.numberOfRatings === 0) {
      throw new CourseDomainException("No ratings to update.");
    }
    const ratingsSum = this.rating * this.numberOfRatings;
    const newRatingsSum = ratingsSum - previousRate + newRate;
    this.rating = Number((newRatingsSum / this.numberOfRatings).toFixed(1));
    this.touch();
  }

  public removeRating(rate: number): void {
    if (!Number.isInteger(rate) || rate < 1 || rate > 5) {
      throw new CourseDomainException(
        "Rating to remove should be integer between 1 and 5.",
      );
    }
    if (this.numberOfRatings === 0) {
      throw new CourseDomainException("No ratings to remove.");
    }
    const ratingsSum = this.rating * this.numberOfRatings;
    const newRatingsSum = ratingsSum - rate;
    this.numberOfRatings = this.numberOfRatings - 1;
    if (this.numberOfRatings === 0) {
      this.rating = 0;
    } else {
      this.rating = Number((newRatingsSum / this.numberOfRatings).toFixed(1));
    }
    this.touch();
  }

  public resetRatings(): void {
    this.rating = 0;
    this.numberOfRatings = 0;
    this.touch();
  }

  public updatePrice(newPrice: number, newDiscountPrice?: number): void {
    if (typeof newPrice !== "number" || newPrice <= 0) {
      throw new CourseDomainException("Price must be a positive number.");
    }
    if (
      newDiscountPrice !== undefined &&
      (typeof newDiscountPrice !== "number" || newDiscountPrice < 0)
    ) {
      throw new CourseDomainException("Discount price must be positive.");
    }
    this.price = newPrice;
    if (newDiscountPrice !== undefined) this.discountPrice = newDiscountPrice;
    this.touch();
  }

  public changeInstructor(newInstructor: User, newInstructorId?: string): void {
    if (!newInstructor) throw new CourseDomainException("User is required.");
    this.instructor = newInstructor;
    if (newInstructorId) this.instructorId = newInstructorId;
    this.touch();
  }

  public isPublished(): boolean {
    return this.status === "published";
  }
  public isDeleted(): boolean {
    return this.status === CourseStatus.DELETED;
  }
  public isDraft(): boolean {
    return this.status === "draft";
  }

  private touch() {
    this.updatedAt = new Date();
  }

  public toSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
      instructorId: this.instructorId,
      title: this.title,
      slug: this.slug,
      subTitle: this.subTitle,
      category: this.category,
      subCategory: this.subCategory,
      courseLanguage: this.courseLanguage,
      subtitleLanguage: this.subtitleLanguage,
      level: this.level,
      topics: [...this.topics],
      duration: this.duration,
      durationUnit: this.durationUnit,
      description: this.description,
      status: this.status,
      thumbnail: this.thumbnail,
      trailer: this.trailer,
      learningOutcomes: [...this.learningOutcomes],
      targetAudience: [...this.targetAudience],
      courseRequirements: [...this.courseRequirements],
      price: this.price,
      discountPrice: this.discountPrice,
      currency: this.currency,
      numberOfRatings: this.numberOfRatings,
      totalLessonCount: this.totalLessonCount,
      rating: this.rating,
      students: this.students,
      sections: this.sections.map((s) => s.getId()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      idempotencyKey: this.idempotencyKey,
    };
  }

  public toPrimitive(): Record<string, unknown> {
    return {
      id: this.id,
      instructorId: this.instructorId,
      idempotencyKey: this.idempotencyKey,
      status: this.status,
      details: {
        title: this.title,
        slug: this.slug,
        subTitle: this.subTitle,
        category: this.category,
        subCategory: this.subCategory,
        courseLanguage: this.courseLanguage,
        subtitleLanguage: this.subtitleLanguage,
        level: this.level,
        topics: [...this.topics],
        duration: this.duration,
        durationUnit: this.durationUnit,
        description: this.description,
        thumbnail: this.thumbnail,
        trailer: this.trailer,
        discountPrice: this.discountPrice,
        price: this.price,
        currency: this.currency,
        learningOutcomes: [...this.learningOutcomes],
        targetAudience: [...this.targetAudience],
        requirements: [...this.courseRequirements],
      },
      options: {
        numberOfRatings: this.numberOfRatings,
        rating: this.rating,
        students: this.students,
        totalLessonCount: this.totalLessonCount,
        createdAt: this.createdAt
          ? this.createdAt.toISOString
            ? this.createdAt.toISOString()
            : this.createdAt
          : undefined,
        updatedAt: this.updatedAt
          ? this.updatedAt.toISOString
            ? this.updatedAt.toISOString()
            : this.updatedAt
          : undefined,
        deletedAt: this.deletedAt
          ? this.deletedAt.toISOString
            ? this.deletedAt.toISOString()
            : this.deletedAt
          : undefined,
      },
      sections: this.sections.map((section) => section.toPrimitive()),
    };
  }

  public static fromPrimitive(
    primitive: any,
    instructor: User,
    sections: Section[],
  ): Course {
    const details: CourseDetails = {
      title: primitive.details?.title,
      slug: primitive.details?.slug,
      subTitle: primitive.details?.subTitle,
      category: primitive.details?.category,
      subCategory: primitive.details?.subCategory,
      courseLanguage: primitive.details?.courseLanguage,
      subtitleLanguage: primitive.details?.subtitleLanguage,
      level: primitive.details?.level,
      topics: Array.isArray(primitive.details?.topics)
        ? [...primitive.details.topics]
        : [],
      duration: primitive.details?.duration,
      durationUnit: primitive.details?.durationUnit,
      description: primitive.details?.description,
      thumbnail: primitive.details?.thumbnail,
      trailer: primitive.details?.trailer,
      discountPrice: primitive.details?.discountPrice,
      price: primitive.details?.price,
      currency: primitive.details?.currency,
      learningOutcomes: Array.isArray(primitive.details?.learningOutcomes)
        ? [...primitive.details.learningOutcomes]
        : [],
      targetAudience: Array.isArray(primitive.details?.targetAudience)
        ? [...primitive.details.targetAudience]
        : [],
      requirements: Array.isArray(primitive.details?.requirements)
        ? [...primitive.details.requirements]
        : [],
    };
    const options: CourseOptions = {
      numberOfRatings: primitive.options?.numberOfRatings ?? 0,
      rating: primitive.options?.rating ?? 0,
      students: primitive.options?.students ?? 0,
      totalLessonCount: primitive.options?.totalLessonCount ?? 0,
      createdAt: primitive.options?.createdAt
        ? new Date(primitive.options.createdAt)
        : undefined,
      updatedAt: primitive.options?.updatedAt
        ? new Date(primitive.options.updatedAt)
        : undefined,
      deletedAt: primitive.options?.deletedAt
        ? new Date(primitive.options.deletedAt)
        : undefined,
    };
    return new Course({
      id: primitive.id,
      instructor: instructor,
      instructorId: primitive.instructorId,
      idempotencyKey: primitive.idempotencyKey,
      status: primitive.status,
      details,
      options,
      sections,
    });
  }
}
