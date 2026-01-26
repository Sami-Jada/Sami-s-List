import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    required: false,
    description: 'User full name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'ahmad@example.com',
    required: false,
    description: 'User email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  // Note: Phone cannot be changed for security reasons
}
