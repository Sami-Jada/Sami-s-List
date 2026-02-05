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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { SetVendorServicesDto } from './dto/vendor-service-link.dto';
import { MulterFile } from './types/multer-file.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active vendors (public)' })
  @ApiResponse({ status: 200, description: 'List of vendors' })
  async findAll(@Query() filters: VendorFilterDto) {
    return this.vendorsService.findAll(filters);
  }

  @Public()
  @Get('nearest')
  @ApiOperation({ summary: 'Find nearest vendors to coordinates (public)' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lng', type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Maximum number of results' })
  @ApiResponse({ status: 200, description: 'List of nearest vendors with distance' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async findNearest(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendorsService.findNearest(
      parseFloat(latitude),
      parseFloat(longitude),
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get offered services (with prices) for a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'List of offered services with prices' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorServices(@Param('id') id: string) {
    return this.vendorsService.getVendorServices(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Put(':id/services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set offered services and prices for a vendor (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Updated list of offered services' })
  @ApiResponse({ status: 400, description: 'Invalid service ID' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async setVendorServices(
    @Param('id') id: string,
    @Body() dto: SetVendorServicesDto,
  ) {
    return this.vendorsService.setVendorServices(id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details by ID (public)' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor details' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new vendor (admin only)' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or phone already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.create(createVendorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'VENDOR')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor (vendor/admin only)' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Verify vendor ownership when VENDOR role is used
    // For now, allow if admin or vendor (ownership check can be added later)
    return this.vendorsService.update(id, updateVendorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Put(':id/upload-image')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload vendor image (admin only)' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor with updated imageUrl' })
  @ApiResponse({ status: 400, description: 'No file or invalid file type/size' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Use form field "file".');
    }
    return this.vendorsService.uploadImage(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Put(':id/toggle-active')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle vendor active status (admin only)' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor status toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async toggleActive(@Param('id') id: string) {
    return this.vendorsService.toggleActive(id);
  }
}
