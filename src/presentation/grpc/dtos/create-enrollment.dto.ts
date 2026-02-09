import { IsNotEmpty, IsString } from "class-validator";
import OrderCompleteDto from "src/presentation/kafka/dtos/order-complete.event-dto";

export class CreateEnrollmentRequestDto extends OrderCompleteDto{
  @IsNotEmpty({ message: "User ID is required" })
  @IsString({ message: "User ID must be a string" })
  userId: string;

  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  courseId: string;
  
  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  orderId: string;
}
