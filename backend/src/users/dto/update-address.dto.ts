import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressLabel } from './create-address.dto';

export class UpdateAddressDto {
  @ApiProperty({
    enum: AddressLabel,
    example: AddressLabel.HOME,
    required: false,
    description: 'Address label (HOME, WORK, OTHER)',
  })
  @IsEnum(AddressLabel)
  @IsOptional()
  label?: AddressLabel;

  @ApiProperty({
    example: '123 Jabal Amman, Building 5, Apartment 12',
    required: false,
    description: 'Full address line',
  })
  @IsString()
  @IsOptional()
  addressLine?: string;

  @ApiProperty({
    example: 'Amman',
    required: false,
    description: 'City name',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 31.9539,
    required: false,
    description: 'Latitude coordinate (must be between 29-34 for Jordan)',
  })
  @IsNumber()
  @Min(29, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Max(34, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    example: 35.9106,
    required: false,
    description: 'Longitude coordinate (must be between 34-40 for Jordan)',
  })
  @IsNumber()
  @Min(34, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Max(40, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Set as default address',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isDefault?: boolean;
}



