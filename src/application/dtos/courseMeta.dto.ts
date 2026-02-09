import {
  CourseMetadata as CourseDomainMeta,
  UserMeta,
} from "src/domain/entities/course.entity";
import { CourseMetadata } from "src/infrastructure/grpc/generated/course/types/course";

export class CourseMetadataDto {
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
  instructor: UserMeta | undefined;

  static fromPrimitive(meta: CourseDomainMeta): CourseMetadataDto {
    const dto = new CourseMetadataDto();
    dto.id = meta.id;
    dto.title = meta.title;
    dto.topics = meta.topics;
    dto.instructorId = meta.instructorId;
    dto.subTitle = meta.subTitle;
    dto.category = meta.category;
    dto.subCategory = meta.subCategory;
    dto.language = meta.language;
    dto.subtitleLanguage = meta.subtitleLanguage;
    dto.level = meta.level;
    dto.durationValue = meta.durationValue;
    dto.durationUnit = meta.durationUnit;
    dto.description = meta.description;
    dto.learningOutcomes = meta.learningOutcomes;
    dto.targetAudience = meta.targetAudience;
    dto.requirements = meta.requirements;
    dto.thumbnail = meta.thumbnail;
    dto.trailer = meta.trailer;
    dto.status = meta.status;
    dto.slug = meta.slug;
    dto.rating = meta.rating;
    dto.numberOfRating = meta.numberOfRating;
    dto.students = meta.students;
    dto.createdAt = meta.createdAt;
    dto.updatedAt = meta.updatedAt;
    dto.deletedAt = meta.deletedAt;
    dto.price = meta.price;
    dto.noOfLessons = meta.noOfLessons;
    dto.noOfSections = meta.noOfSections;
    dto.noOfQuizzes = meta.noOfQuizzes;
    dto.discountPrice = meta.discountPrice;
    dto.currency = meta.currency;
    dto.instructor = meta.instructor as UserMeta;

    return dto;
  }

  public toGrpcResponse = (): CourseMetadata => {
    return {
      id: this.id,
      title: this.title,
      subTitle: this.subTitle,
      description: this.description,
      learningOutcomes: this.learningOutcomes,
      requirements: this.requirements,
      topics: this.topics,
      status: this.status,
      slug: this.slug,
      students: this.students,
      rating: this.rating,
      category: this.category,
      instructor: {
        id: this.instructor.id,
        name: this.instructor.name,
        avatar: this.instructor.avatar,
        email: this.instructor.email,
      },
      numberOfRating: this.numberOfRating,

      subCategory: this.subCategory,
      currency: this.currency,
      discountPrice: this.discountPrice,
      price: this.price,
      durationUnit: this.durationUnit,
      durationValue: this.durationValue,
      language: this.language,
      subtitleLanguage: this.subtitleLanguage,
      targetAudience: this.targetAudience,
      thumbnail: this.thumbnail,
      trailer: this.trailer,
      level: this.level,
      instructorId: this.instructorId,
      noOfLessons: this.noOfLessons,
      noOfQuizzes: this.noOfQuizzes,
      noOfSections: this.noOfSections,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  };
}
