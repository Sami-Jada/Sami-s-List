import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'Plumbers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: 'plumbers' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'plumber' })
  @IsString()
  @IsNotEmpty()
  iconName: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPopular?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}
