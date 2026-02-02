import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List service categories (public)' })
  @ApiQuery({ name: 'popular', required: false, type: Boolean, description: 'Filter to popular services only' })
  @ApiResponse({ status: 200, description: 'List of service categories' })
  async findAll(@Query() filters: ServiceFilterDto) {
    return this.servicesService.findMany(filters);
  }
}
