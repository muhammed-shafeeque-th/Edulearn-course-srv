import { Course, CourseStatus } from "src/domain/entities/course.entity";
import { SectionDto } from "./section.dto";
import {
  CourseData,
  CourseMetadata,
} from "src/infrastructure/grpc/generated/course/types/course";
import { User } from "src/infrastructure/grpc/generated/course/common";

export class CourseDto {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  subTitle?: string;
  category?: string;
  instructor?: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
  } | null;
  subCategory?: string;
  courseLanguage?: string;
  subtitleLanguage?: string;
  level?: string;
  topics?: string[];
  duration?: number;
  durationUnit?: string;
  description?: string;
  status?: CourseStatus;
  thumbnail?: string;
  trailer?: string;
  currency?: string;
  price?: number;
  discountPrice?: number;
  learningOutcomes?: string[];
  targetAudience?: string[];
  courseRequirements?: string[];
  numberOfRatings?: number;
  rating?: number;
  students?: number;
  sections: SectionDto[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static fromDomain(course: Course): CourseDto {
    const dto = new CourseDto();
    dto.id = course.getId();
    dto.instructorId = course.getInstructorId();
    dto.title = course.getTitle();
    dto.slug = course.getSlug();
    dto.subTitle = course.getSubTitle();
    dto.instructor = {
      avatar: course.getInstructor().getAvatar(),
      id: course.getInstructor().getId(),
      name: course.getInstructor().getName(),
      email: course.getInstructor().getEmail(),
    };
    dto.category = course.getCategory();
    dto.subCategory = course.getSubCategory();
    dto.courseLanguage = course.getCourseLanguage();
    dto.subtitleLanguage = course.getSubtitleLanguage();
    dto.level = course.getLevel();
    dto.topics = course.getTopics();
    dto.duration = course.getDuration();
    dto.durationUnit = course.getDurationUnit();
    dto.description = course.getDescription();
    dto.status = course.getStatus();
    dto.numberOfRatings = course.getNumberOfRatings();
    dto.rating = course.getRating();
    dto.students = course.getStudents();
    dto.thumbnail = course.getThumbnail();
    dto.trailer = course.getTrailer();
    dto.currency = course.getCurrency();
    dto.price = course.getPrice();
    dto.discountPrice = course.getDiscountPrice();
    dto.learningOutcomes = course.getWhatYouWillLearn();
    dto.targetAudience = course.getTargetAudience();
    dto.courseRequirements = course.getCourseRequirements();
    dto.sections = course.getSections().map(SectionDto.fromDomain);
    dto.createdAt = course.getCreatedAt();
    dto.updatedAt = course.getUpdatedAt();
    dto.deletedAt = course.getDeletedAt();

    return dto;
  }

  public toGrpcResponse = (): CourseData => {
    return {
      id: this.id,
      title: this.title,
      subTitle: this.subTitle,
      description: this.description,
      learningOutcomes: this.learningOutcomes,
      requirements: this.courseRequirements,
      topics: this.topics,
      status: this.status,
      slug: this.slug,
      students: this.students,
      rating: this.rating,
      numberOfRating: this.numberOfRatings,
      category: this.category,
      instructor: this.instructor
        ? ({
            avatar: this.instructor.avatar,
            id: this.instructor.id,
            name: this.instructor.name,
            email: this.instructor.email,
          } as User)
        : undefined,
      subCategory: this.subCategory,
      currency: this.currency,
      discountPrice: this.discountPrice,
      price: this.price,
      durationUnit: this.durationUnit,
      durationValue: this.duration?.toString(),
      language: this.courseLanguage,
      subtitleLanguage: this.subtitleLanguage,
      targetAudience: this.targetAudience,
      thumbnail: this.thumbnail,
      trailer: this.trailer,
      level: this.level,
      instructorId: this.instructorId,
      sections: this.sections?.map((section) => section.toGrpcResponse()),
      createdAt: this.createdAt?.toISOString?.(),
      updatedAt: this.updatedAt?.toISOString?.(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString?.() : null,
    };
  };

 
}
