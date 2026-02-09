import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { Quiz, Question } from "../../domain/entities/quiz.entity";

export class QuizDto {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description: string;
  timeLimit: number;
  maxAttempts: number;
  passingScore: number;
  questions: Question[];
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  static fromDomain(quiz: Quiz): QuizDto {
    const dto = new QuizDto();
    dto.id = quiz.getId();
    dto.sectionId = quiz.getSectionId();
    dto.courseId = quiz.getCourseId();
    dto.title = quiz.getTitle();
    dto.description = quiz.getDescription();
    dto.timeLimit = quiz.getTimeLimit();
    dto.maxAttempts = quiz.getMaxAttempts();
    dto.passingScore = quiz.getPassingScore();
    dto.questions = quiz.getQuestions();
    dto.isRequired = quiz.getIsRequired();
    dto.createdAt = quiz.getCreatedAt();
    dto.updatedAt = quiz.getUpdatedAt();
    dto.deletedAt = quiz.getDeletedAt();

    return dto;
  }

  public toGrpcResponse = (): QuizData => {
    return {
      id: this.id,
      courseId: this.courseId,
      sectionId: this.sectionId,
      title: this.title,
      description: this.description,
      timeLimit: this.timeLimit,
      passingScore: this.passingScore,
      questions:
        this.questions?.map((q) => ({
          id: q.getId(),
          question: q.getQuestion(),
          required: q.isRequired(),
          type: q.getType(),
          timeLimit: q.getTimeLimit(),
          points: q.getPoint(),
          options: q.getOptions(),
          correctAnswer: q.getCorrectAnswer()?.toString(),
          explanation: q.getExplanation() ?? "",
        })) ?? [],
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt?.toISOString() : "",
    };
  };
}
