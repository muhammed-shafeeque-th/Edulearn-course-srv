import { IsString, IsNotEmpty, IsArray } from "class-validator";
import { CreateQuizRequest, Question } from "src/infrastructure/grpc/generated/course/types/quiz";

export class CreateQuizDto implements CreateQuizRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
  
  @IsArray()
  @IsString({ each: true })
  questions: Question[];
  
  description?: string;
  
  isRequired: boolean;
  maxAttempts: number;
  passingScore: number;
  
  
  @IsString()
  @IsNotEmpty()
  sectionId: string;
  timeLimit: number;

}
