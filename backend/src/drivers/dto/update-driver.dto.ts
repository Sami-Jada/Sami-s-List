import { IsString, IsOptional, IsObject, ValidateNested, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class VehicleInfoDto {
  @ApiProperty({
    example: 'Truck',
    required: false,
    description: 'Vehicle type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: 'AMM-1234',
    required: false,
    description: 'Vehicle license plate number',
  })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiProperty({
    example: 'White',
    required: false,
    description: 'Vehicle color',
  })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateDriverDto {
  @ApiProperty({
    example: 'Ahmad Al-Mahmoud',
    required: false,
    description: 'Driver full name',
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
    type: VehicleInfoDto,
    required: false,
    description: 'Vehicle information',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  @IsOptional()
  vehicleInfo?: VehicleInfoDto;
}





