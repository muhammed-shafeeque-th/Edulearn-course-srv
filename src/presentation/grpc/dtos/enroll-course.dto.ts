import { IsString, IsNotEmpty } from "class-validator";

export class EnrollCourseRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;
}
