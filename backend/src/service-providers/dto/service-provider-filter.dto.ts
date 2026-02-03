import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ServiceProviderFilterDto {
  @ApiProperty({
    required: false,
    description: 'Filter by vendor ID',
  })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by availability status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isAvailable?: boolean;
}
