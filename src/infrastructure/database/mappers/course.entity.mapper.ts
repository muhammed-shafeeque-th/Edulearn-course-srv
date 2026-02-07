import { UserOrmEntity } from "../entities/user.entity";
import { CourseOrmEntity } from "../entities/course.orm-entity";
import { Course, CourseMetadata } from "src/domain/entities/course.entity";
import { UserEntityMapper } from "./user.entity.mapper";
import { SectionEntityMapper } from "./section.entity.mapper";
import { CategoryOrmEntity } from "../entities/category-orm.entity";
import { Category } from "src/domain/entities/category.entity";

/**
 * CourseEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class CourseEntityMapper {
  // --- Course Mapping ---

  static toOrmCourse(course: Course): CourseOrmEntity {
    const orm = new CourseOrmEntity();
    orm.id = course.getId();
    orm.title = course.getTitle();
    orm.description = course.getDescription();
    orm.instructorId = course.getInstructorId();
    orm.category = course.getCategory();
    orm.subCategory = course.getSubCategory();
    orm.idempotencyKey = course.getIdempotencyKey();
    orm.topics = course.getTopics();
    orm.courseLanguage = course.getCourseLanguage();
    orm.subtitleLanguage = course.getSubtitleLanguage();
    orm.subTitle = course.getSubTitle();
    orm.courseRequirements = course.getCourseRequirements();
    orm.learningOutcomes = course.getWhatYouWillLearn();
    orm.duration = course.getDuration();
    orm.durationUnit = course.getDurationUnit();
    orm.currency = course.getCurrency();
    orm.status = course.getStatus();
    orm.level = course.getLevel();
    orm.students = course.getStudents();
    orm.rating = course.getRating();
    orm.numberOfRatings = course.getNumberOfRatings();
    orm.trailer = course.getTrailer();
    orm.price = course.getPrice();
    orm.discountPrice = course.getDiscountPrice();
    orm.targetAudience = course.getTargetAudience();
    orm.thumbnail = course.getThumbnail();
    orm.slug = course.getSlug();
    orm.totalLessonsCount = course.getTotalLessonCount();
    orm.createdAt = course.getCreatedAt();
    orm.updatedAt = course.getUpdatedAt();
    orm.deletedAt = course.getDeletedAt();

    const instructor = course.getInstructor();
    if (instructor) {
      orm.instructor = UserEntityMapper.toOrmUser(instructor);
    }

    // Sections & their nested objects
    // orm.sections = (course.getSections() || []).map(CourseEntityMapper.toOrmSection);

    return orm;
  }

  static toCourseMetadataFromRaw(raw: any, instructor?: any): CourseMetadata {
    return {
      id: raw.course_id,
      title: raw.course_title,
      topics: raw.course_topics ?? [],
      instructorId: raw.course_instructor_id,

      subTitle: raw.course_sub_title,
      category: raw.course_category,
      subCategory: raw.course_sub_category,

      language: raw.course_course_language,
      subtitleLanguage: raw.course_subtitle_language,

      level: raw.course_level,

      durationValue:
        raw.course_duration !== null ? String(raw.course_duration) : "0",
      durationUnit: raw.course_duration_unit ?? "",

      description: raw.course_description ?? undefined,

      learningOutcomes: raw.course_learning_outcomes ?? [],
      targetAudience: raw.course_target_audience ?? [],
      requirements: raw.course_course_requirements ?? [],

      thumbnail: raw.course_thumbnail ?? undefined,
      trailer: raw.course_trailer ?? undefined,

      status: raw.course_status,
      slug: raw.course_slug,

      rating: Number(raw.course_rating ?? 0),
      numberOfRating: Number(raw.course_number_of_ratings ?? 0),
      students: Number(raw.course_students ?? 0),

      createdAt: raw.course_created_at?.toISOString
        ? raw.course_created_at.toISOString()
        : String(raw.course_created_at),
      updatedAt: raw.course_updated_at?.toISOString
        ? raw.course_updated_at.toISOString()
        : String(raw.course_updated_at),
      deletedAt: raw.course_deleted_at
        ? (raw.course_deleted_at?.toISOString?.() ??
          String(raw.course_deleted_at))
        : undefined,

      price: raw.course_price ?? undefined,
      discountPrice: raw.course_discount_price ?? undefined,
      currency: raw.course_currency ?? undefined,

      noOfSections: Number(raw.noOfSections ?? 0),
      noOfLessons: Number(raw.noOfLessons ?? 0),
      noOfQuizzes: Number(raw.noOfQuizzes ?? 0),

      instructor: instructor
        ? UserEntityMapper.toDomainUser(instructor as UserOrmEntity)
        : undefined,
    };
  }

  static toDomainCourse(orm: CourseOrmEntity): Course {
    return new Course({
      id: orm.id,
      instructor: orm.instructor
        ? UserEntityMapper.toDomainUser(orm.instructor)
        : undefined,
      instructorId: orm.instructorId,
      idempotencyKey: orm.idempotencyKey,
      details: {
        title: orm.title,
        slug: orm.slug,
        subTitle: orm.subTitle,
        category: orm.category,
        subCategory: orm.subCategory,
        courseLanguage: orm.courseLanguage,
        subtitleLanguage: orm.subtitleLanguage,
        level: orm.level,
        topics: orm.topics,
        duration: orm.duration,
        durationUnit: orm.durationUnit,
        description: orm.description,
        thumbnail: orm.thumbnail,
        trailer: orm.trailer,
        learningOutcomes: orm.learningOutcomes,
        targetAudience: orm.targetAudience,
        requirements: orm.courseRequirements,
        price: orm.price,
        discountPrice: orm.discountPrice,
        currency: orm.currency,
      },
      status: orm.status,
      options: {
        numberOfRatings: orm.numberOfRatings,
        totalLessonCount: orm.totalLessonsCount,
        rating: orm.rating,
        students: orm.students,
        createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
        updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
        deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
      },
      sections: (Array.isArray(orm.sections) ? orm.sections : []).map(
        SectionEntityMapper.toDomainSection
      ),
    });
  }

  // --- Category Mapping ---

  static toOrmCategory(category: Category): CategoryOrmEntity {
    const orm = new CategoryOrmEntity();
    orm.id = category.getId();
    orm.name = category.getName();
    orm.idempotencyKey = category.getIdempotencyKey();
    orm.slug = category.getSlug();
    orm.description = category.getDescription();
    if (category.getParentId()) {
      orm.parent = { id: category.getParentId() } as CategoryOrmEntity;
    }
    return orm;
  }

  static toDomainCategory(orm: CategoryOrmEntity): Category {
    return new Category(
      orm.id,
      orm.name,
      orm.slug,
      orm.idempotencyKey,
      orm.description,
      orm.parent?.id,
      orm.createdAt,
      orm.updatedAt
    );
  }

}
