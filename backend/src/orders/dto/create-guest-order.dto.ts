import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@samis-list/shared';
import { CreateAddressDto } from '../../users/dto/create-address.dto';

export class CreateGuestOrderDto {
  @ApiProperty({
    example: '+962791234567',
    description: 'Jordan phone number in international format (+962XXXXXXXXX)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+962[789]\d{8}$/, {
    message: 'Phone number must be a valid Jordan number in format +962XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    type: CreateAddressDto,
    description: 'Delivery address',
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty()
  address: CreateAddressDto;

  @ApiProperty({
    description: 'Number of gas cylinders',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1, { message: 'Minimum order quantity is 1' })
  @Max(10, { message: 'Maximum order quantity is 10' })
  @Type(() => Number)
  @IsNotEmpty()
  tankQuantity: number;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method',
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
