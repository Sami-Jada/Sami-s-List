import { IsString, IsOptional, IsObject, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceProviderDto {
  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    required: false,
    description: 'Service provider full name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '+962791234567',
    required: false,
    description: 'Jordan phone number',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+962[789]\d{8}$/, {
    message: 'Phone number must be a valid Jordan number in format +962XXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'Extra info (e.g. vehicle, tools, certifications)',
  })
  @IsObject()
  @IsOptional()
  extraInfo?: Record<string, unknown>;
}
