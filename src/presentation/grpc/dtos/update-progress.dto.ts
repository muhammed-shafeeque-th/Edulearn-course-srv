import { IsString, IsNotEmpty } from "class-validator";

export class UpdateProgressRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  lessonId: string;
}
