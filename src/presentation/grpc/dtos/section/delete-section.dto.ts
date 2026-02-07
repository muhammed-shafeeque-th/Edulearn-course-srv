import {  IsNotEmpty, IsNumber, IsString } from "class-validator";
import { DeleteSectionRequest } from "src/infrastructure/grpc/generated/course/types/section";

export class DeleteSectionDto implements DeleteSectionRequest {
    @IsNotEmpty()
    @IsString()
    sectionId: string;
    @IsNotEmpty()
    @IsString()
    userId: string;
    @IsNotEmpty()
    @IsString()
    courseId: string;
  }