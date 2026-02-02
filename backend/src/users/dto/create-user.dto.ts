import { IsEmail, IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: '+962791234567',
    description: 'Jordan phone number in international format (+962XXXXXXXXX)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+962[789]\d{8}$/, {
    message: 'Phone number must be a valid Jordan number in format +962XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    description: 'User full name (optional for guest creation)',
    required: false,
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
}
