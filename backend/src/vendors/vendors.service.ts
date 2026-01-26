import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find all vendors with optional filters
   */
  async findAll(filters?: VendorFilterDto) {
    const where: Prisma.VendorWhereInput = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else {
      // Default to active vendors only for public access
      where.isActive = true;
    }

    if (filters?.minRating !== undefined) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      include: {
        drivers: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            orders: true,
            drivers: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Filter by distance if coordinates provided
    if (filters?.latitude && filters?.longitude && filters?.maxDistance) {
      return vendors
        .map((vendor) => {
          const distance = this.calculateDistance(
            filters.latitude!,
            filters.longitude!,
            Number(vendor.latitude),
            Number(vendor.longitude),
          );
          return { ...vendor, distance };
        })
        .filter((vendor) => vendor.distance <= filters.maxDistance!)
        .sort((a, b) => a.distance! - b.distance!);
    }

    return vendors;
  }

  /**
   * Find vendor by ID
   */
  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            isAvailable: true,
            rating: true,
            totalDeliveries: true,
          },
        },
        _count: {
          select: {
            orders: true,
            drivers: true,
            ratings: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Find nearest vendors using PostGIS
   */
  async findNearest(
    latitude: number,
    longitude: number,
    limit: number = 10,
  ): Promise<any[]> {
    // Validate coordinates
    this.validateCoordinates(latitude, longitude);

    // Use PostGIS for accurate distance calculation
    const vendors = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id,
        name,
        phone,
        "businessLicense",
        address,
        latitude,
        longitude,
        "tankPrice",
        "serviceFee",
        "isActive",
        rating,
        "totalOrders",
        "createdAt",
        "updatedAt",
        ST_Distance(
          ST_MakePoint(longitude::float, latitude::float),
          ST_MakePoint(${longitude}::float, ${latitude}::float)
        ) * 111.32 as distance_km
      FROM vendors
      WHERE "isActive" = true
      ORDER BY distance_km
      LIMIT ${limit}
    `;

    // Convert Decimal fields to numbers
    return vendors.map((vendor) => ({
      ...vendor,
      latitude: Number(vendor.latitude),
      longitude: Number(vendor.longitude),
      tankPrice: Number(vendor.tankPrice),
      serviceFee: Number(vendor.serviceFee),
      distance: Number(vendor.distance_km),
    }));
  }

  /**
   * Create a new vendor
   */
  async create(createVendorDto: CreateVendorDto) {
    // Validate coordinates
    this.validateCoordinates(createVendorDto.latitude, createVendorDto.longitude);

    // Check if phone already exists
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { phone: createVendorDto.phone },
    });

    if (existingVendor) {
      throw new BadRequestException('Phone number already registered');
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        isActive: createVendorDto.isActive ?? true,
      },
    });

    this.logger.log(`Vendor created: ${vendor.id} (${vendor.name})`);

    return vendor;
  }

  /**
   * Update vendor
   */
  async update(id: string, updateVendorDto: UpdateVendorDto) {
    const vendor = await this.findById(id);

    // Validate coordinates if provided
    if (updateVendorDto.latitude !== undefined || updateVendorDto.longitude !== undefined) {
      const latitude = updateVendorDto.latitude ?? Number(vendor.latitude);
      const longitude = updateVendorDto.longitude ?? Number(vendor.longitude);
      this.validateCoordinates(latitude, longitude);
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto,
    });

    this.logger.log(`Vendor updated: ${id}`);

    return updatedVendor;
  }

  /**
   * Toggle vendor active status
   */
  async toggleActive(id: string) {
    const vendor = await this.findById(id);

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        isActive: !vendor.isActive,
      },
    });

    this.logger.log(
      `Vendor ${id} ${updatedVendor.isActive ? 'activated' : 'deactivated'}`,
    );

    return updatedVendor;
  }

  /**
   * Recalculate and update vendor rating from order ratings
   */
  async updateRating(id: string) {
    const vendor = await this.findById(id);

    // Get all ratings for this vendor
    const ratings = await this.prisma.rating.findMany({
      where: {
        vendorId: id,
      },
      select: {
        rating: true,
      },
    });

    if (ratings.length === 0) {
      // No ratings yet, set to 0
      return this.prisma.vendor.update({
        where: { id },
        data: { rating: 0 },
      });
    }

    // Calculate average rating
    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      },
    });

    this.logger.log(
      `Vendor rating updated: ${id} (${updatedVendor.rating})`,
    );

    return updatedVendor;
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

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
