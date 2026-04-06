import { IsString, IsNotEmpty } from "class-validator";

export class AddModuleRequestDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
