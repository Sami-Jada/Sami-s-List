import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// AddressLabel is a string in the database, using enum-like values
export enum AddressLabel {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER',
}

export class CreateAddressDto {
  @ApiProperty({
    enum: AddressLabel,
    example: AddressLabel.HOME,
    description: 'Address label (HOME, WORK, OTHER)',
  })
  @IsEnum(AddressLabel)
  @IsNotEmpty()
  label: AddressLabel;

  @ApiProperty({
    example: '123 Jabal Amman, Building 5, Apartment 12',
    description: 'Full address line',
  })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiProperty({
    example: 'Amman',
    description: 'City name',
    default: 'Amman',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 31.9539,
    description: 'Latitude coordinate (must be between 29-34 for Jordan)',
  })
  @IsNumber()
  @Min(29, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Max(34, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Type(() => Number)
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    example: 35.9106,
    description: 'Longitude coordinate (must be between 34-40 for Jordan)',
  })
  @IsNumber()
  @Min(34, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Max(40, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Type(() => Number)
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    example: false,
    description: 'Set as default address',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isDefault?: boolean;
}



