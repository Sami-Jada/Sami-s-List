import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ServiceFilterDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  popular?: boolean;
}
