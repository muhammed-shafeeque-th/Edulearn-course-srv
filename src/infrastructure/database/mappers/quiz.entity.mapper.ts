import { QuizOrmEntity } from "../entities/quiz.orm-entity";
import { Question, Quiz } from "src/domain/entities/quiz.entity";

/**
 * QuizEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class QuizEntityMapper {
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

}
