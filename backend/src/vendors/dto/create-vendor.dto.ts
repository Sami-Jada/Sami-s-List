import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VendorServiceLinkDto } from './vendor-service-link.dto';

export class CreateVendorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  businessLicense?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ description: 'Vendor description (required)' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL path to vendor image (e.g. from upload)' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Structured opening hours per weekday. e.g. { "monday": { "open": "09:00", "close": "17:00" }, "tuesday": null, ... }',
    example: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: null,
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '15:00' },
      saturday: null,
      sunday: null,
    },
  })
  @IsObject()
  openingHours: Record<string, { open: string; close: string } | null>;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    type: [VendorServiceLinkDto],
    description: 'Optional: services offered by this vendor with price per service. Can be added later via PUT /vendors/:id/services',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorServiceLinkDto)
  services?: VendorServiceLinkDto[];
}
