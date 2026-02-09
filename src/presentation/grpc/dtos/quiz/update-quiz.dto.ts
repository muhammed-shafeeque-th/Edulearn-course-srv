import { IsString, IsNotEmpty, IsArray } from "class-validator";
import { Question, UpdateQuizRequest } from "src/infrastructure/grpc/generated/course/types/quiz";
export class UpdateQuizDto implements UpdateQuizRequest {
  @IsString()
  @IsNotEmpty()
  quizId: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  questions: Question[];

  description: string;

  isRequired: boolean;
  maxAttempts: number;
  passingScore: number;

  @IsString()
  @IsNotEmpty()
  sectionId: string;
  timeLimit: number;
}
