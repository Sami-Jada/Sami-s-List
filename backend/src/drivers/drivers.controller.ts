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
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Roles('ADMIN', 'VENDOR')
  @Get('vendors/:vendorId/drivers')
  @ApiOperation({ summary: 'Get all drivers for a vendor (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'List of drivers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorDrivers(@Param('vendorId') vendorId: string) {
    return this.driversService.findByVendor(vendorId);
  }

  @Roles('ADMIN', 'VENDOR')
  @Get('vendors/:vendorId/drivers/available')
  @ApiOperation({ summary: 'Get available drivers for a vendor (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'List of available drivers' })
  async getAvailableDrivers(@Param('vendorId') vendorId: string) {
    return this.driversService.findAvailable(vendorId);
  }

  @Roles('ADMIN', 'VENDOR', 'DRIVER')
  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver details (vendor/admin/driver)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver details' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Roles('ADMIN', 'VENDOR')
  @Post('vendors/:vendorId/drivers')
  @ApiOperation({ summary: 'Create a new driver (vendor/admin)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or phone already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async create(
    @Param('vendorId') vendorId: string,
    @Body() createDriverDto: CreateDriverDto,
  ) {
    return this.driversService.create(vendorId, createDriverDto);
  }

  @Roles('ADMIN', 'VENDOR', 'DRIVER')
  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update driver (driver/vendor/admin)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Verify ownership when DRIVER role is used
    // For now, allow if admin, vendor, or driver (ownership check can be added later)
    return this.driversService.update(id, updateDriverDto);
  }

  @Roles('DRIVER')
  @Put('drivers/:id/location')
  @ApiOperation({ summary: 'Update driver location (driver only)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - driver only' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateDriverLocationDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Verify driver owns this ID when DRIVER role is used
    return this.driversService.updateLocation(id, updateLocationDto);
  }

  @Roles('DRIVER')
  @Put('drivers/:id/toggle-availability')
  @ApiOperation({ summary: 'Toggle driver availability (driver only)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Availability toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - driver only' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async toggleAvailability(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // TODO: Verify driver owns this ID when DRIVER role is used
    return this.driversService.toggleAvailability(id);
  }
}





