import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { VendorServiceLinkDto } from './dto/vendor-service-link.dto';
import { MulterFile } from './types/multer-file.interface';
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

    if (filters?.serviceId) {
      where.serviceLinks = {
        some: { serviceId: filters.serviceId },
      };
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      include: {
        serviceProviders: {
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
            serviceProviders: true,
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
        serviceLinks: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                iconName: true,
              },
            },
          },
        },
        serviceProviders: {
          select: {
            id: true,
            name: true,
            phone: true,
            isAvailable: true,
            rating: true,
            totalJobs: true,
          },
        },
        _count: {
          select: {
            orders: true,
            serviceProviders: true,
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

    // Use PostGIS for accurate distance calculation (no unitPrice/serviceFee on Vendor)
    const vendors = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id,
        name,
        phone,
        "businessLicense",
        address,
        latitude,
        longitude,
        description,
        "imageUrl",
        "openingHours",
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

    return vendors.map((vendor) => ({
      ...vendor,
      latitude: Number(vendor.latitude),
      longitude: Number(vendor.longitude),
      distance: Number(vendor.distance_km),
    }));
  }

  /**
   * Find nearest vendors that offer a given service (for order creation).
   * Returns vendors with distance and the price for that service (from VendorService).
   */
  async findNearestByService(
    serviceId: string,
    latitude: number,
    longitude: number,
    limit: number = 1,
  ): Promise<Array<{ id: string; distance: number; unitPrice: number; serviceFee: number; [key: string]: unknown }>> {
    this.validateCoordinates(latitude, longitude);
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        v.id,
        v.name,
        v.phone,
        v.address,
        v.latitude,
        v.longitude,
        v."isActive",
        vs."unitPrice",
        vs."serviceFee",
        ST_Distance(
          ST_MakePoint(v.longitude::float, v.latitude::float),
          ST_MakePoint(${longitude}::float, ${latitude}::float)
        ) * 111.32 as distance_km
      FROM vendors v
      INNER JOIN vendor_services vs ON vs."vendorId" = v.id AND vs."serviceId" = ${serviceId}
      WHERE v."isActive" = true
      ORDER BY distance_km
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      distance: Number(r.distance_km),
      unitPrice: r.unitPrice != null ? Number(r.unitPrice) : 0,
      serviceFee: r.serviceFee != null ? Number(r.serviceFee) : 0,
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
        name: createVendorDto.name,
        phone: createVendorDto.phone,
        businessLicense: createVendorDto.businessLicense,
        address: createVendorDto.address,
        latitude: createVendorDto.latitude,
        longitude: createVendorDto.longitude,
        description: createVendorDto.description,
        imageUrl: createVendorDto.imageUrl,
        openingHours: createVendorDto.openingHours as object,
        isActive: createVendorDto.isActive ?? true,
      },
    });

    if (createVendorDto.services?.length) {
      await this.syncVendorServices(vendor.id, createVendorDto.services);
    }

    this.logger.log(`Vendor created: ${vendor.id} (${vendor.name})`);

    return this.findById(vendor.id);
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

    const { services, ...vendorData } = updateVendorDto as UpdateVendorDto & { services?: CreateVendorDto['services'] };
    const data: Prisma.VendorUpdateInput = { ...vendorData };
    if (vendorData.openingHours !== undefined) {
      data.openingHours = vendorData.openingHours as object;
    }

    await this.prisma.vendor.update({
      where: { id },
      data,
    });

    if (services !== undefined) {
      await this.syncVendorServices(id, services);
    }

    this.logger.log(`Vendor updated: ${id}`);

    return this.findById(id);
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
   * Upload vendor image and set imageUrl (admin)
   */
  async uploadImage(vendorId: string, file: MulterFile) {
    const vendor = await this.findById(vendorId);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP',
      );
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }
    const ext = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : 'webp';
    const uploadsDir = join(process.cwd(), 'uploads', 'vendors');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${vendorId}.${ext}`;
    const filepath = join(uploadsDir, filename);
    writeFileSync(filepath, file.buffer);
    const imageUrl = `vendors/${filename}`;
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { imageUrl },
    });
    this.logger.log(`Vendor image uploaded: ${vendorId}`);
    return this.findById(vendorId);
  }

  /**
   * Get offered services (with prices) for a vendor
   */
  async getVendorServices(vendorId: string) {
    await this.findById(vendorId); // throws if not found
    return this.prisma.vendorService.findMany({
      where: { vendorId },
      include: {
        service: {
          select: { id: true, name: true, slug: true, iconName: true },
        },
      },
    });
  }

  /**
   * Replace vendor's offered services with the given list (each with price)
   */
  async setVendorServices(vendorId: string, dto: { services: VendorServiceLinkDto[] }) {
    await this.findById(vendorId); // throws if not found
    await this.syncVendorServices(vendorId, dto.services);
    return this.getVendorServices(vendorId);
  }

  /**
   * Sync VendorService rows for a vendor (delete existing, create new with prices)
   */
  private async syncVendorServices(vendorId: string, services: VendorServiceLinkDto[]) {
    await this.prisma.vendorService.deleteMany({ where: { vendorId } });
    for (const link of services) {
      const service = await this.prisma.service.findUnique({
        where: { id: link.serviceId },
      });
      if (!service) {
        throw new BadRequestException(`Service with ID ${link.serviceId} not found`);
      }
      await this.prisma.vendorService.create({
        data: {
          vendorId,
          serviceId: link.serviceId,
          unitPrice: link.unitPrice,
          serviceFee: link.serviceFee,
        },
      });
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
