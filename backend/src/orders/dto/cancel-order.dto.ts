import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CancelledBy {
  USER = 'user',
  VENDOR = 'vendor',
  SERVICE_PROVIDER = 'service_provider',
}

export class CancelOrderDto {
  @ApiProperty({
    enum: CancelledBy,
    description: 'Who is cancelling the order',
    example: CancelledBy.USER,
  })
  @IsEnum(CancelledBy)
  @IsNotEmpty()
  cancelledBy: CancelledBy;

  @ApiProperty({
    required: false,
    description: 'Reason for cancellation',
    example: 'Changed my mind',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}



