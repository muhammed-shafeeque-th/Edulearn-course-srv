import { IsNotEmpty, IsString } from "class-validator";

export class CreateEnrollmentRequestDto {
  @IsNotEmpty({ message: "User ID is required" })
  @IsString({ message: "User ID must be a string" })
  userId: string;

  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  courseId: string;
}
