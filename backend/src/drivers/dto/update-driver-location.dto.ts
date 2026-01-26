import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDriverLocationDto {
  @ApiProperty({
    example: 31.9539,
    description: 'Current latitude (must be between 29-34 for Jordan)',
  })
  @IsNumber()
  @Min(29, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Max(34, { message: 'Latitude must be between 29 and 34 (Jordan bounds)' })
  @Type(() => Number)
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    example: 35.9106,
    description: 'Current longitude (must be between 34-40 for Jordan)',
  })
  @IsNumber()
  @Min(34, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Max(40, { message: 'Longitude must be between 34 and 40 (Jordan bounds)' })
  @Type(() => Number)
  @IsNotEmpty()
  longitude: number;
}





