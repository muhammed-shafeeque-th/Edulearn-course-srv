import { IsString, IsNotEmpty, IsNumber } from "class-validator";

export class AddLessonRequestDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  duration: number;
}
