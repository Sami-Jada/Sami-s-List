import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  MinLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class VehicleInfoDto {
  @ApiProperty({
    example: 'Truck',
    description: 'Vehicle type (e.g., Truck, Van, Car)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 'AMM-1234',
    description: 'Vehicle license plate number',
  })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({
    example: 'White',
    description: 'Vehicle color',
  })
  @IsString()
  @IsNotEmpty()
  color: string;
}

export class CreateDriverDto {
  @ApiProperty({
    description: 'Vendor ID that owns this driver',
  })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    description: 'Driver full name',
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
    description: 'Initial password for driver login (optional)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiProperty({
    type: VehicleInfoDto,
    description: 'Vehicle information',
    example: {
      type: 'Truck',
      plateNumber: 'AMM-1234',
      color: 'White',
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicleInfo: VehicleInfoDto;
}





