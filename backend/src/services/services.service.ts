import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceFilterDto } from './dto/service-filter.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find service categories with optional popular filter.
   * When popular=true, returns only isPopular=true ordered by sortOrder then name.
   */
  async findMany(filters?: ServiceFilterDto) {
    const where: { isPopular?: boolean } = {};
    if (filters?.popular === true) {
      where.isPopular = true;
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        iconName: true,
        isPopular: true,
        sortOrder: true,
      },
    });

    return services;
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async create(dto: CreateServiceDto) {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.service.create({
      data: {
        name: dto.name,
        slug,
        iconName: dto.iconName,
        isPopular: dto.isPopular ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findById(id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.service.delete({
      where: { id },
    });
    return { deleted: true, id };
  }
}
