import { QuizData } from "src/infrastructure/grpc/generated/course/types/quiz";
import { Quiz } from "../../domain/entities/quiz.entity";

export class QuizMapper {
  static toGrpcResponse(quiz: Quiz): QuizData {
    return {
      id: quiz.getId(),
      moduleId: quiz.getModuleId(),
      courseId: quiz.getCourseId(),
      title: quiz.getTitle(),
      description: quiz.getDescription(),
      timeLimit: quiz.getTimeLimit(),
      // maxAttempts: quiz.getMaxAttempts(),
      passingScore: quiz.getPassingScore(),
      questions:
        quiz.getQuestions()?.map((q) => ({
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
      // isRequired: quiz.getIsRequired(),
      createdAt: quiz.getCreatedAt().toISOString(),
      updatedAt: quiz.getUpdatedAt().toISOString(),
      deletedAt: quiz.getDeletedAt()?.toISOString(),
    };
  }
}
