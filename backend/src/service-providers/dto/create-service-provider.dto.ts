import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceProviderDto {
  @ApiProperty({
    description: 'Vendor ID that owns this service provider',
  })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    description: 'Service provider full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
    example: 'SecurePassword123',
    required: false,
    description: 'Initial password for login (optional)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiProperty({
    required: false,
    description: 'Extra info (e.g. vehicle for delivery, tools/certs for technicians)',
    example: { type: 'Truck', plateNumber: 'AMM-1234', color: 'White' },
  })
  @IsObject()
  @IsOptional()
  extraInfo?: Record<string, unknown>;
}
