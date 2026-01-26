import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDriverDto {
  @ApiProperty({
    description: 'Driver ID to assign to the order',
    example: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  driverId: string;
}





