import { IsOptional, IsBoolean, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VendorFilterDto {
  @ApiProperty({
    required: false,
    description: 'Filter by service (category) ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    required: false,
    description: 'Minimum rating (0-5)',
    example: 4.0,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  @IsOptional()
  minRating?: number;

  @ApiProperty({
    required: false,
    description: 'Maximum distance in kilometers from coordinates',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxDistance?: number;

  @ApiProperty({
    required: false,
    description: 'Latitude for distance calculation',
    example: 31.9539,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    required: false,
    description: 'Longitude for distance calculation',
    example: 35.9106,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  longitude?: number;
}





