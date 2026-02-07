import { IsString, IsNotEmpty } from "class-validator";
import { DeleteQuizRequest } from "src/infrastructure/grpc/generated/course/types/quiz";

export class DeleteQuizDto implements DeleteQuizRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
