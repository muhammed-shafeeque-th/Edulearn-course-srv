import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import BaseEventDto from './base-event.dto';

export class UserUpdateDtoPayload {
  @IsUUID()
  userId!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  // @IsNotEmpty({ message: 'Avatar is required' })
  @IsString({ message: 'Avatar must be a valid string' })
  @IsOptional()
  avatar?: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  firstName: string;

  @IsOptional({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  lastName?: string;

}

export default class UserUpdateDto extends BaseEventDto<UserUpdateDtoPayload> { }
