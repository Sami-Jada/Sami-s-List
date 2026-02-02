import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
    example: 'SecurePassword123',
    description: 'User or driver password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
