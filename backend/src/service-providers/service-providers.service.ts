import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { UpdateServiceProviderLocationDto } from './dto/update-service-provider-location.dto';
import { ServiceProviderFilterDto } from './dto/service-provider-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceProvidersService {
  private readonly logger = new Logger(ServiceProvidersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(filters?: ServiceProviderFilterDto) {
    const where: Prisma.ServiceProviderWhereInput = {};

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    return this.prisma.serviceProvider.findMany({
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

  async findById(id: string) {
    const sp = await this.prisma.serviceProvider.findUnique({
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

    if (!sp) {
      throw new NotFoundException(`Service provider with ID ${id} not found`);
    }

    return sp;
  }

  async findByVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    return this.prisma.serviceProvider.findMany({
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

  async findByPhone(phone: string) {
    const sp = await this.prisma.serviceProvider.findUnique({
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

    if (!sp) {
      throw new NotFoundException(`Service provider with phone ${phone} not found`);
    }

    return sp;
  }

  async findAvailable(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    return this.prisma.serviceProvider.findMany({
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
        totalJobs: true,
        extraInfo: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  async create(vendorId: string, dto: CreateServiceProviderDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    if (dto.vendorId !== vendorId) {
      throw new BadRequestException(
        'Vendor ID in DTO must match the path parameter',
      );
    }

    const existing = await this.prisma.serviceProvider.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException('Phone number already registered');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const sp = await this.prisma.serviceProvider.create({
      data: {
        vendorId: dto.vendorId,
        name: dto.name,
        phone: dto.phone,
        extraInfo: dto.extraInfo as any,
        ...(passwordHash && { passwordHash }),
      },
    });

    await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: {
        phone: dto.phone,
        name: dto.name,
        role: 'SERVICE_PROVIDER',
      },
      update: {
        name: dto.name,
        role: 'SERVICE_PROVIDER',
      },
    });

    this.logger.log(`Service provider created: ${sp.id} (${sp.name}) for vendor ${vendorId}`);

    return sp;
  }

  async update(id: string, dto: UpdateServiceProviderDto) {
    await this.findById(id);

    return this.prisma.serviceProvider.update({
      where: { id },
      data: dto as any,
    });
  }

  async updateLocation(id: string, dto: UpdateServiceProviderLocationDto) {
    await this.findById(id);

    this.validateCoordinates(dto.latitude, dto.longitude);

    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
      },
    });
  }

  async toggleAvailability(id: string) {
    const sp = await this.findById(id);

    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        isAvailable: !sp.isAvailable,
      },
    });
  }

  async updateRating(id: string) {
    const sp = await this.findById(id);

    const ratings = await this.prisma.rating.findMany({
      where: {
        serviceProviderId: id,
      },
      select: {
        rating: true,
      },
    });

    if (ratings.length === 0) {
      return this.prisma.serviceProvider.update({
        where: { id },
        data: { rating: 0 },
      });
    }

    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        rating: Math.round(averageRating * 10) / 10,
      },
    });
  }

  async verifyServiceProviderOwnership(serviceProviderId: string, vendorId: string) {
    const sp = await this.findById(serviceProviderId);

    if (sp.vendorId !== vendorId) {
      throw new ForbiddenException(
        'Service provider does not belong to the specified vendor',
      );
    }
  }

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
