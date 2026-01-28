import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find all drivers with optional filters
   */
  async findAll(filters?: DriverFilterDto) {
    const where: Prisma.DriverWhereInput = {};

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    return this.prisma.driver.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  /**
   * Find driver by ID
   */
  async findById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  /**
   * Find drivers by vendor ID
   */
  async findByVendor(vendorId: string) {
    // Verify vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    return this.prisma.driver.findMany({
      where: { vendorId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find driver by phone number
   */
  async findByPhone(phone: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with phone ${phone} not found`);
    }

    return driver;
  }

  /**
   * Find available drivers for a vendor
   */
  async findAvailable(vendorId: string) {
    // Verify vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    return this.prisma.driver.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentLatitude: true,
        currentLongitude: true,
        rating: true,
        totalDeliveries: true,
        vehicleInfo: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  /**
   * Create a new driver
   */
  async create(vendorId: string, createDriverDto: CreateDriverDto) {
    // Verify vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Verify vendorId matches
    if (createDriverDto.vendorId !== vendorId) {
      throw new BadRequestException(
        'Vendor ID in DTO must match the path parameter',
      );
    }

    // Check if phone already exists
    const existingDriver = await this.prisma.driver.findUnique({
      where: { phone: createDriverDto.phone },
    });

    if (existingDriver) {
      throw new BadRequestException('Phone number already registered');
    }

    const driver = await this.prisma.driver.create({
      data: {
        vendorId: createDriverDto.vendorId,
        name: createDriverDto.name,
        phone: createDriverDto.phone,
        vehicleInfo: createDriverDto.vehicleInfo as any,
      },
    });

    this.logger.log(`Driver created: ${driver.id} (${driver.name}) for vendor ${vendorId}`);

    return driver;
  }

  /**
   * Update driver
   */
  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.findById(id);

    // Validate vehicle info structure if provided
    if (updateDriverDto.vehicleInfo) {
      this.validateVehicleInfo(updateDriverDto.vehicleInfo);
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: updateDriverDto as any,
    });

    this.logger.log(`Driver updated: ${id}`);

    return updatedDriver;
  }

  /**
   * Update driver location
   */
  async updateLocation(id: string, updateLocationDto: UpdateDriverLocationDto) {
    const driver = await this.findById(id);

    // Validate coordinates
    this.validateCoordinates(
      updateLocationDto.latitude,
      updateLocationDto.longitude,
    );

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        currentLatitude: updateLocationDto.latitude,
        currentLongitude: updateLocationDto.longitude,
      },
    });

    this.logger.log(
      `Driver location updated: ${id} (${updateLocationDto.latitude}, ${updateLocationDto.longitude})`,
    );

    return updatedDriver;
  }

  /**
   * Toggle driver availability
   */
  async toggleAvailability(id: string) {
    const driver = await this.findById(id);

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        isAvailable: !driver.isAvailable,
      },
    });

    this.logger.log(
      `Driver ${id} ${updatedDriver.isAvailable ? 'set as available' : 'set as unavailable'}`,
    );

    return updatedDriver;
  }

  /**
   * Recalculate and update driver rating from order ratings
   */
  async updateRating(id: string) {
    const driver = await this.findById(id);

    // Get all ratings for this driver
    const ratings = await this.prisma.rating.findMany({
      where: {
        driverId: id,
      },
      select: {
        rating: true,
      },
    });

    if (ratings.length === 0) {
      // No ratings yet, set to 0
      return this.prisma.driver.update({
        where: { id },
        data: { rating: 0 },
      });
    }

    // Calculate average rating
    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      },
    });

    this.logger.log(`Driver rating updated: ${id} (${updatedDriver.rating})`);

    return updatedDriver;
  }

  /**
   * Verify driver belongs to vendor
   */
  async verifyDriverOwnership(driverId: string, vendorId: string) {
    const driver = await this.findById(driverId);

    if (driver.vendorId !== vendorId) {
      throw new ForbiddenException(
        'Driver does not belong to the specified vendor',
      );
    }
  }

  /**
   * Verify driver ownership by user (for driver role)
   */
  async verifyDriverOwnershipByUser(driverId: string, userId: string) {
    // TODO: Implement when driver-user relationship is established
    // For now, this is a placeholder
    const driver = await this.findById(driverId);
    // Add user verification logic when driver-user relationship exists
  }

  /**
   * Validate vehicle info structure
   */
  private validateVehicleInfo(vehicleInfo: any) {
    if (!vehicleInfo.type || !vehicleInfo.plateNumber || !vehicleInfo.color) {
      throw new BadRequestException(
        'Vehicle info must contain type, plateNumber, and color',
      );
    }
  }

  /**
   * Validate coordinates are within Jordan bounds
   */
  private validateCoordinates(latitude: number, longitude: number) {
    if (latitude < 29 || latitude > 34) {
      throw new BadRequestException(
        'Latitude must be between 29 and 34 (Jordan bounds)',
      );
    }

    if (longitude < 34 || longitude > 40) {
      throw new BadRequestException(
        'Longitude must be between 34 and 40 (Jordan bounds)',
      );
    }
  }
}



