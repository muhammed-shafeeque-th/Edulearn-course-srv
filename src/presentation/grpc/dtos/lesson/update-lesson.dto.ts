import { IsString, IsNotEmpty, IsNumber } from "class-validator";
import { ContentMetaData, UpdateLessonRequest } from "src/infrastructure/grpc/generated/course/types/lesson";

export class UpdateLessonDto implements UpdateLessonRequest {
  @IsString()
  @IsNotEmpty()
  courseId: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;
  
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  // @IsString()
  // @IsNotEmpty()
  // content: string;

  // @IsNumber()

  contentType?: string;
  contentUrl?: string;
  description?: string;
  estimatedDuration?: number;
  isPreview?: boolean;
  isPublished?: boolean;
  metadata: ContentMetaData;
  order?: number;
}
