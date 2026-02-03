import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@samis-list/shared';
import { Type } from 'class-transformer';

export class OrderFilterDto {
  @ApiProperty({
    required: false,
    description: 'Filter by user ID',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by vendor ID',
  })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by service provider ID',
  })
  @IsString()
  @IsOptional()
  serviceProviderId?: string;

  @ApiProperty({
    enum: OrderStatus,
    required: false,
    description: 'Filter by order status',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    required: false,
    description: 'Filter orders from this date (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Filter orders until this date (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}



