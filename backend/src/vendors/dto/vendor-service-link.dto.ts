import { IsString, IsNotEmpty, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VendorServiceLinkDto {
  @ApiProperty({ description: 'Service (category) ID' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Unit price for this service', example: 8.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ description: 'Service fee (e.g. delivery)', example: 2 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceFee: number;
}

export class SetVendorServicesDto {
  @ApiProperty({
    type: [VendorServiceLinkDto],
    description: 'List of services offered by this vendor with price per service',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorServiceLinkDto)
  services: VendorServiceLinkDto[];
}
