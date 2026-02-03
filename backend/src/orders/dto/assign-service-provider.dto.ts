import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignServiceProviderDto {
  @ApiProperty({
    description: 'Service provider ID to assign to the order',
    example: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  serviceProviderId: string;
}
