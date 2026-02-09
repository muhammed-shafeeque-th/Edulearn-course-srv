import { LessonDomainException } from "../exceptions/domain.exceptions";

export enum ContentType {
  VIDEO = "video",
  TEXT = "text",
  QUIZ = "quiz",
  PDF = "pdf",
  LINK = "link",
}

export interface ContentMetadata {
  s3Url?: string;
  fileName?: string;
  fileSize?: number; 
  duration?: number; 
  mimeType?: string;
  thumbnailUrl?: string;
  [key: string]: any; 
}

export interface LessonProps {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  idempotencyKey?: string;
  contentType?: ContentType;
  contentUrl?: string;
  order?: number;
  metadata?: ContentMetadata;
  isPreview?: boolean;
  isPublished?: boolean;
  duration?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Lesson {
  
  private readonly id: string;
  private readonly sectionId: string;
  private readonly idempotencyKey?: string;

  
  private title: string;
  private description?: string;
  private contentType?: ContentType;
  private contentUrl?: string;
  private order: number;
  private metadata?: ContentMetadata;
  private isPreview: boolean;
  private isPublished: boolean;
  private duration?: number;

  
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt?: Date;

  constructor(props: LessonProps) {
    if (!props.id?.trim())
      throw new LessonDomainException("Lesson ID is required.");
    if (!props.sectionId?.trim())
      throw new LessonDomainException("Section ID is required.");
    if (!props.title?.trim())
      throw new LessonDomainException("Lesson title is required.");

    this.id = props.id.trim();
    this.sectionId = props.sectionId.trim();
    this.idempotencyKey = props.idempotencyKey;
    this.title = props.title.trim();
    this.description = props.description?.trim();
    this.contentType = props.contentType;
    this.contentUrl = props.contentUrl;
    this.order = props.order ?? 0;
    this.metadata = props.metadata ? { ...props.metadata } : undefined;
    this.isPreview = props.isPreview ?? false;
    this.isPublished = props.isPublished ?? false;
    this.duration = props.duration;
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

  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getContentType(): ContentType | undefined {
    return this.contentType;
  }

  getContentUrl(): string | undefined {
    return this.contentUrl;
  }

  getOrder(): number {
    return this.order;
  }

  getMetadata(): ContentMetadata | undefined {
    return this.metadata ? { ...this.metadata } : undefined;
  }

  getIsPreview(): boolean {
    return this.isPreview;
  }

  getIsPublished(): boolean {
    return this.isPublished;
  }

  getDuration(): number | undefined {
    return this.duration;
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
      Omit<
        LessonProps,
        "id" | "sectionId" | "createdAt" | "updatedAt" | "deletedAt"
      >
    >
  ): void {
    if (details.title !== undefined && details.title.trim().length > 0) {
      this.title = details.title.trim();
    }
    if ("description" in details) {
      this.description = details.description?.trim();
    }
    if ("contentType" in details && details.contentType !== undefined) {
      this.contentType = details.contentType;
    }
    if ("contentUrl" in details) {
      this.contentUrl = details.contentUrl;
    }
    if ("order" in details && details.order !== undefined) {
      this.order = details.order;
    }
    if ("metadata" in details && details.metadata !== undefined) {
      this.metadata = { ...details.metadata };
    }
    if ("isPreview" in details && details.isPreview !== undefined) {
      this.isPreview = details.isPreview;
    }
    if ("isPublished" in details && details.isPublished !== undefined) {
      this.isPublished = details.isPublished;
    }
    if ("duration" in details && details.duration !== undefined) {
      this.duration = details.duration;
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

  markPreview(isPreview: boolean): void {
    if (this.isPreview === isPreview) return;
    this.isPreview = isPreview;

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

  toPrimitive() {
    return {
      id: this.id,
      sectionId: this.sectionId,
      idempotencyKey: this.idempotencyKey,
      title: this.title,
      description: this.description,
      contentType: this.contentType,
      contentUrl: this.contentUrl,
      order: this.order,
      metadata: this.metadata,
      isPreview: this.isPreview,
      isPublished: this.isPublished,
      duration: this.duration,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
