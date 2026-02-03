import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDecimal, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

  @ApiProperty({ required: false, description: 'Default per-unit or per-job price' })
  @IsDecimal()
  @IsOptional()
  unitPrice?: string;

  @ApiProperty({ required: false, description: 'Service fee (e.g. delivery fee)' })
  @IsDecimal()
  @IsOptional()
  serviceFee?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
