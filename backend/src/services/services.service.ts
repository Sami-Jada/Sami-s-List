import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceFilterDto } from './dto/service-filter.dto';

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
}
