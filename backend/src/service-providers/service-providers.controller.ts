import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ServiceProvidersService } from './service-providers.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateServiceProviderLocationDto } from './dto/update-service-provider-location.dto';
import { ServiceProviderFilterDto } from './dto/service-provider-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ServiceProviders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ServiceProvidersController {
  constructor(private readonly serviceProvidersService: ServiceProvidersService) {}

  @Roles('ADMIN', 'VENDOR')
  @Get('vendors/:vendorId/service-providers')
  @ApiOperation({ summary: 'Get all service providers for a vendor (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'List of service providers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorServiceProviders(@Param('vendorId') vendorId: string) {
    return this.serviceProvidersService.findByVendor(vendorId);
  }

  @Roles('ADMIN', 'VENDOR')
  @Get('vendors/:vendorId/service-providers/available')
  @ApiOperation({ summary: 'Get available service providers for a vendor (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'List of available service providers' })
  async getAvailableServiceProviders(@Param('vendorId') vendorId: string) {
    return this.serviceProvidersService.findAvailable(vendorId);
  }

  @Roles('ADMIN', 'VENDOR', 'SERVICE_PROVIDER')
  @Get('service-providers/:id')
  @ApiOperation({ summary: 'Get service provider details (vendor/admin/service provider)' })
  @ApiParam({ name: 'id', description: 'Service provider ID' })
  @ApiResponse({ status: 200, description: 'Service provider details' })
  @ApiResponse({ status: 404, description: 'Service provider not found' })
  async findOne(@Param('id') id: string) {
    return this.serviceProvidersService.findById(id);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('vendors/:vendorId/service-providers')
  @ApiOperation({ summary: 'Create a new service provider (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 201, description: 'Service provider created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or phone already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async create(
    @Param('vendorId') vendorId: string,
    @Body() createDto: CreateServiceProviderDto,
  ) {
    return this.serviceProvidersService.create(vendorId, createDto);
  }

  @Roles('ADMIN', 'VENDOR', 'SERVICE_PROVIDER')
  @Patch('service-providers/:id')
  @ApiOperation({ summary: 'Update service provider (service provider/vendor/admin)' })
  @ApiParam({ name: 'id', description: 'Service provider ID' })
  @ApiResponse({ status: 200, description: 'Service provider updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service provider not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceProviderDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceProvidersService.update(id, updateDto);
  }

  @Roles('SERVICE_PROVIDER')
  @Put('service-providers/:id/location')
  @ApiOperation({ summary: 'Update service provider location (service provider only)' })
  @ApiParam({ name: 'id', description: 'Service provider ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - service provider only' })
  @ApiResponse({ status: 404, description: 'Service provider not found' })
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateServiceProviderLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceProvidersService.updateLocation(id, updateLocationDto);
  }

  @Roles('SERVICE_PROVIDER')
  @Put('service-providers/:id/toggle-availability')
  @ApiOperation({ summary: 'Toggle service provider availability (service provider only)' })
  @ApiParam({ name: 'id', description: 'Service provider ID' })
  @ApiResponse({ status: 200, description: 'Availability toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - service provider only' })
  @ApiResponse({ status: 404, description: 'Service provider not found' })
  async toggleAvailability(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.serviceProvidersService.toggleAvailability(id);
  }
}
