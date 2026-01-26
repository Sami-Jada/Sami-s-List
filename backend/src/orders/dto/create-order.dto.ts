import { IsString, IsNotEmpty, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@samis-list/shared';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Address ID for delivery',
    example: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  addressId: string;

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
