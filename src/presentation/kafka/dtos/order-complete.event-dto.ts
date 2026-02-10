import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import BaseEventDto from './base-event.dto';

class OrderCompletedItemDto {
  @IsNotEmpty({ message: "Course ID is required" })
  @IsString({ message: "Course ID must be a string" })
  courseId: string;

  @IsNotEmpty({ message: "Price is required" })
  @IsNumber({}, { message: "Price must be a number" })
  @Min(0, { message: "Price must be at least 0" })
  price: number;
}

export class OrderCompletedEventPayload {

  @IsNotEmpty({ message: "Order ID is required" })
  @IsString({ message: "Order ID must be a string" })
  orderId: string;

  @IsNotEmpty({ message: "eventId is required" })
  @IsString({ message: "eventId must be a string" })
  eventId: string;

  @IsNotEmpty({ message: "User ID is required" })
  @IsString({ message: "User ID must be a string" })
  userId: string;

  @IsArray({ message: "Items must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OrderCompletedItemDto)
  items: OrderCompletedItemDto[];

  @IsNotEmpty({ message: "Total is required" })
  @IsNumber({}, { message: "Total must be a number" })
  @Min(0, { message: "Total must be at least 0" })
  amount: number;

  currency: string
}

export default class OrderCompletedEventDTO extends BaseEventDto<OrderCompletedEventPayload> { }


