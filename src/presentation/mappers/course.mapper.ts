import {
  Course,
  CourseMetadata as CourseDomainMetadata,
  CourseStatus,
  UserMeta,
} from "src/domain/entities/course.entity";
import { ModuleMapper } from "./module.mapper";
import {
  CourseData,
  CourseMetadata,
} from "src/infrastructure/grpc/generated/course/types/course";
import { User } from "src/infrastructure/grpc/generated/course/common";

export class CourseMapper {
  static toGrpcCourseResponse(course: Course): CourseData {
    return {
      id: course.getId(),
      instructorId: course.getInstructorId(),
      title: course.getTitle(),
      slug: course.getSlug(),
      subTitle: course.getSubTitle(),
      instructor: {
        avatar: course.getInstructor().getAvatar(),
        id: course.getInstructor().getId(),
        name: course.getInstructor().getName(),
        email: course.getInstructor().getEmail(),
      },
      category: course.getCategory(),
      subCategory: course.getSubCategory(),
      language: course.getCourseLanguage(),
      subtitleLanguage: course.getSubtitleLanguage(),
      level: course.getLevel(),
      topics: course.getTopics(),
      durationValue: course.getDuration()?.toString(),
      durationUnit: course.getDurationUnit(),
      description: course.getDescription(),
      status: course.getStatus(),
      numberOfRating: course.getNumberOfRatings(),
      rating: course.getRating(),
      students: course.getStudents(),
      thumbnail: course.getThumbnail(),
      trailer: course.getTrailer(),
      currency: course.getCurrency(),
      price: course.getPrice(),
      discountPrice: course.getDiscountPrice(),
      learningOutcomes: course.getWhatYouWillLearn(),
      targetAudience: course.getTargetAudience(),
      requirements: course.getCourseRequirements(),
      modules: course.getModules().map((m) => ModuleMapper.toGrpcResponse(m)),
      createdAt: course.getCreatedAt().toISOString(),
      updatedAt: course.getUpdatedAt().toISOString(),
      deletedAt: course.getDeletedAt()?.toISOString() ?? undefined,
    };
  }

  static toGrpcCourseMetaResponse(meta: CourseDomainMetadata): CourseMetadata {
    const instructor = meta.instructor as UserMeta;
    return {
      id: meta.id,
      title: meta.title,
      subTitle: meta.subTitle,
      description: meta.description,
      learningOutcomes: meta.learningOutcomes,
      requirements: meta.requirements,
      topics: meta.topics,
      status: meta.status,
      slug: meta.slug,
      students: meta.students,
      rating: meta.rating,
      category: meta.category,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        avatar: instructor.avatar,
        email: instructor.email,
      },
      numberOfRating: meta.numberOfRating,

      subCategory: meta.subCategory,
      currency: meta.currency,
      discountPrice: meta.discountPrice,
      price: meta.price,
      durationUnit: meta.durationUnit,
      durationValue: meta.durationValue,
      language: meta.language,
      subtitleLanguage: meta.subtitleLanguage,
      targetAudience: meta.targetAudience,
      thumbnail: meta.thumbnail,
      trailer: meta.trailer,
      level: meta.level,
      instructorId: meta.instructorId,
      noOfLessons: meta.noOfLessons,
      noOfQuizzes: meta.noOfQuizzes,
      noOfModules: meta.noOfModules,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      deletedAt: meta.deletedAt,
    };
  }
}
