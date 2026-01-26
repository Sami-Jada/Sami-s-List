import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+962791234567',
    description: 'Jordan phone number in international format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+962[789]\d{8}$/, {
    message: 'Phone number must be a valid Jordan number in format +962XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;
}





