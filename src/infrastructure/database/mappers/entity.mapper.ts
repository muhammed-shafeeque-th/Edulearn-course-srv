import { User } from "src/domain/entities/user.entity";
import { UserOrmEntity } from "../entities/user.entity";
import { SectionOrmEntity } from "../entities/section.orm-entity";
import { Section } from "src/domain/entities/section.entity";
import { ReviewOrmEntity } from "../entities/review.entity";
import { Review } from "src/domain/entities/review.entity";
import { QuizOrmEntity } from "../entities/quiz.orm-entity";
import { Question, Quiz } from "src/domain/entities/quiz.entity";
import { Progress, UnitType } from "src/domain/entities/progress.entity";
import { ProgressOrmEntity } from "../entities/progress.orm-entity";
import { LessonOrmEntity } from "../entities/lesson.orm-entity";
import { Lesson } from "src/domain/entities/lesson.entity";
import {
  Enrollment,
  EnrollmentStatus,
} from "src/domain/entities/enrollment.entity";
import { EnrollmentOrmEntity } from "../entities/enrollment.orm-entity";
import { Category } from "src/domain/entities/category.entity";
import { CategoryOrmEntity } from "../entities/category-orm.entity";
import { CourseOrmEntity } from "../entities/course.orm-entity";
import { Course, CourseMetadata } from "src/domain/entities/course.entity";
import { Certificate } from "src/domain/entities/certificate.entity";
import { CertificateOrmEntity } from "../entities/certificate-orm.entity";

/**
 * EntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class EntityMapper {
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
      orm.instructor = EntityMapper.toOrmUser(instructor);
    }

    // Sections & their nested objects
    // orm.sections = (course.getSections() || []).map(EntityMapper.toOrmSection);

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
        ? EntityMapper.toDomainUser(instructor as UserOrmEntity)
        : undefined,
    };
  }

  static toDomainCourse(orm: CourseOrmEntity): Course {
    return new Course({
      id: orm.id,
      instructor: orm.instructor
        ? EntityMapper.toDomainUser(orm.instructor)
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
        EntityMapper.toDomainSection
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

  // --- Enrollment Mapping ---

  static toOrmEnrollment(enrollment: Enrollment): EnrollmentOrmEntity {
    const orm = new EnrollmentOrmEntity();
    orm.id = enrollment.getId();
    orm.userId = enrollment.getUserId();
    orm.courseId = enrollment.getCourseId();
    orm.orderId = enrollment.getOrderId();
    orm.idempotencyKey = enrollment.getIdempotencyKey();
    orm.enrolledAt = enrollment.getEnrolledAt();
    orm.status = enrollment.getStatus();
    orm.progressPercent = enrollment.getProgressPercent();
    orm.completedAt = enrollment.getCompletedAt();
    orm.createdAt = enrollment.getCreatedAt();
    orm.updatedAt = enrollment.getUpdatedAt();
    orm.deletedAt = enrollment.getDeletedAt();
    orm.totalLearningUnits = enrollment.getTotalLearningUnits();
    orm.completedLearningUnits = enrollment.getCompletedLearningUnits();
    const progressEntries = enrollment.getProgressEntries();
    if (progressEntries && progressEntries.length) {
      orm.progressEntries = progressEntries.map(EntityMapper.toOrmProgress);
    }
    return orm;
  }

  static toDomainEnrollment(
    orm: EnrollmentOrmEntity,
    opts?: { withProgress: boolean }
  ): Enrollment {
    let progressDomain: Progress[] = [];
    if (opts?.withProgress && orm.progressEntries) {
      progressDomain = orm.progressEntries.map(EntityMapper.toDomainProgress);
    }
    const enrollment = new Enrollment(
      orm.id,
      orm.userId,
      orm.courseId,
      orm.orderId,
      orm.idempotencyKey,
      orm.enrolledAt,
      orm.status as EnrollmentStatus,
      orm.progressPercent,
      orm.completedAt,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt,
      progressDomain,
      orm.totalLearningUnits,
      orm.completedLearningUnits
    );
    if (orm.course) {
      const course = EntityMapper.toDomainCourse(orm.course);
      enrollment.setCourse(course);
    }

    return enrollment;
  }

  // -------- Certificate -----------

  static toOrmCertificate(certificate: Certificate): CertificateOrmEntity {
    const orm = new CertificateOrmEntity();
    orm.id = certificate.getId();
    orm.enrollmentId = certificate.getEnrollmentId();
    orm.userId = certificate.getUserId();
    orm.courseId = certificate.getCourseId();
    orm.courseTitle = certificate.getCourseTitle();
    orm.studentName = certificate.getStudentName();
    orm.completedAt = certificate.getCompletedAt();
    orm.certificateNumber = certificate.getCertificateNumber();
    orm.issueDate = certificate.getIssueDate();
    orm.createdAt = certificate.getCreatedAt();
    orm.updatedAt = certificate.getUpdatedAt();
    return orm;
  }

  static toDomainCertificate(orm: CertificateOrmEntity): Certificate {
    return new Certificate(
      orm.id,
      orm.enrollmentId,
      orm.userId,
      orm.courseId,
      orm.courseTitle,
      orm.studentName,
      orm.completedAt,
      orm.certificateNumber,
      orm.issueDate,
      orm.createdAt,
      orm.updatedAt
    );
  }

  // --- Lesson Mapping ---

  static toOrmLesson(lesson: Lesson): LessonOrmEntity {
    const orm = new LessonOrmEntity();
    orm.id = lesson.getId();
    orm.sectionId = lesson.getSectionId();
    orm.title = lesson.getTitle();
    orm.contentType = lesson.getContentType();
    orm.idempotencyKey = lesson.getIdempotencyKey();
    orm.contentUrl = lesson.getContentUrl();
    orm.description = lesson.getDescription();
    orm.isPreview = lesson.getIsPreview();
    orm.isPublished = lesson.getIsPublished();
    orm.order = lesson.getOrder();
    orm.metadata = lesson.getMetadata();
    orm.duration = lesson.getDuration();
    orm.createdAt = lesson.getCreatedAt();
    orm.updatedAt = lesson.getUpdatedAt();
    orm.deletedAt = lesson.getDeletedAt();
    return orm;
  }

  static toDomainLesson(orm: LessonOrmEntity): Lesson {
    return new Lesson({
      id: orm.id,
      sectionId: orm.sectionId,
      title: orm.title,
      description: orm.description,
      idempotencyKey: orm.idempotencyKey,
      contentType: orm.contentType,
      contentUrl: orm.contentUrl,
      order: orm.order,
      metadata: orm.metadata,
      isPreview: orm.isPreview,
      isPublished: orm.isPublished,
      duration: orm.duration,
      createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
      updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }

  // --- Progress Mapping ---

  static toOrmProgress(progress: Progress): ProgressOrmEntity {
    const orm = new ProgressOrmEntity();
    orm.id = progress.getId();
    orm.enrollmentId = progress.getEnrollmentId();
    orm.lessonId = progress.getLessonId();
    orm.quizId = progress.getQuizId();
    orm.unitDuration = progress.getDuration();
    orm.watchTime = progress.getWatchTime();
    orm.attempts = progress.getAttempts();
    orm.unitType = progress.getUnitType();
    orm.isPassed = progress.getPassed();
    orm.score = progress.getScore();
    orm.completedAt = progress.getCompletedAt();
    orm.isCompleted = progress.isCompleted();
    orm.createdAt = progress.getCreatedAt();
    orm.updatedAt = progress.getUpdatedAt();
    orm.deletedAt = progress.getDeletedAt();
    return orm;
  }

  static toDomainProgress(orm: ProgressOrmEntity): Progress {
    return new Progress(
      orm.id,
      orm.enrollmentId,
      orm.lessonId,
      orm.quizId,
      orm.unitType as UnitType,
      orm.isCompleted,
      orm.score,
      orm.attempts,
      orm.watchTime,
      orm.unitDuration,
      orm.completedAt,
      orm.isPassed,
      orm.createdAt,
      orm.updatedAt,
      orm.deletedAt
    );
  }

  // --- Quiz Mapping ---

  static toOrmQuiz(quiz: Quiz): QuizOrmEntity {
    const orm = new QuizOrmEntity();
    orm.id = quiz.getId();
    orm.sectionId = quiz.getSectionId();
    orm.courseId = quiz.getCourseId();
    orm.title = quiz.getTitle();
    orm.description = quiz.getDescription();
    orm.timeLimit = quiz.getTimeLimit();
    orm.passingScore = quiz.getPassingScore();
    orm.idempotencyKey = quiz.getIdempotencyKey();
    orm.maxAttempts = quiz.getMaxAttempts();
    orm.isRequired = quiz.getIsRequired();
    orm.questions = (quiz.getQuestions() || []).map((question) =>
      question.toPrimitive()
    );
    orm.createdAt = quiz.getCreatedAt();
    orm.updatedAt = quiz.getUpdatedAt();
    orm.deletedAt = quiz.getDeletedAt();
    return orm;
  }

  static toDomainQuiz(orm: QuizOrmEntity): Quiz {
    const questions = (orm.questions || []).map((question): Question => {
      return new Question({
        id: question.id,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        options: question.options,
        point: question.point,
        question: question.question,
        required: question.required,
        timeLimit: question.timeLimit,
        type: question.type,
      });
    });

    return new Quiz({
      id: orm.id,
      sectionId: orm.sectionId,
      courseId: orm.courseId,
      idempotencyKey: orm.idempotencyKey,
      title: orm.title,
      description: orm.description,
      timeLimit: orm.timeLimit,
      maxAttempts: orm.maxAttempts,
      passingScore: orm.passingScore,
      questions,
      isRequired: orm.isRequired,
      createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
      updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }

  // --- Review Mapping ---

  static toOrmReview(review: Review): ReviewOrmEntity {
    const orm = new ReviewOrmEntity();
    orm.id = review.getId();
    orm.user = EntityMapper.toOrmUser(review.getUser());
    orm.userId = review.getUserId();
    orm.courseId = review.getCourseId();
    orm.enrollmentId = review.getEnrollmentId();
    orm.rating = review.getRating();
    orm.comment = review.getComment();
    orm.createdAt = review.getCreatedAt();
    orm.updatedAt = review.getUpdatedAt();
    orm.deletedAt = review.getDeletedAt();
    return orm;
  }

  static toDomainReview(orm: ReviewOrmEntity): Review {
    const instructor = orm.user
      ? EntityMapper.toDomainUser(orm.user)
      : undefined;
    return new Review(
      orm.id,
      orm.userId,
      instructor,
      orm.courseId,
      orm.enrollmentId,
      orm.rating,
      orm.comment,
      orm.createdAt ? new Date(orm.createdAt) : undefined,
      orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      orm.deletedAt ? new Date(orm.deletedAt) : undefined
    );
  }

  // --- Section Mapping ---

  static toOrmSection(section: Section): SectionOrmEntity {
    const orm = new SectionOrmEntity();
    orm.id = section.getId();
    orm.courseId = section.getCourseId();
    orm.title = section.getTitle();
    orm.idempotencyKey = section.getIdempotencyKey();
    orm.order = section.getOrder();
    orm.description = section.getDescription();
    orm.isPublished = section.getIsPublished();
    // orm.lessons = (section.getLessons() || []).map(EntityMapper.toOrmLesson);
    // const quiz = section.getQuiz();
    // if (quiz) orm.quiz = EntityMapper.toOrmQuiz(quiz);
    orm.createdAt = section.getCreatedAt();
    orm.updatedAt = section.getUpdatedAt();
    orm.deletedAt = section.getDeletedAt();
    return orm;
  }

  static toDomainSection(orm: SectionOrmEntity): Section {
    return new Section({
      id: orm.id,
      courseId: orm.courseId,
      title: orm.title,
      idempotencyKey: orm.idempotencyKey,
      order: orm.order,
      description: orm.description,
      isPublished: orm.isPublished,
      lessons: (Array.isArray(orm.lessons) ? orm.lessons : []).map(
        EntityMapper.toDomainLesson
      ),
      quiz: orm.quiz ? EntityMapper.toDomainQuiz(orm.quiz) : undefined,
      createdAt: orm.createdAt ? new Date(orm.createdAt) : undefined,
      updatedAt: orm.updatedAt ? new Date(orm.updatedAt) : undefined,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }

  // --- User/User Mapping ---

  static toOrmUser(user: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = user.getId();
    orm.avatar = user.getAvatar();
    orm.email = user.getEmail();
    orm.name = user.getName();
    orm.updatedAt = user.getUpdatedAt();
    return orm;
  }

  static toDomainUser(orm: UserOrmEntity): User {
    return new User(
      orm.id,
      orm.name,
      orm.avatar,
      orm.email,
      new Date(orm.updatedAt)
    );
  }
}
