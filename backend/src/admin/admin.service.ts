import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const phone = `admin-${dto.username}`;
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new BadRequestException('Username conflicts with an existing admin placeholder; try a different username');
    }
    const user = await this.prisma.user.create({
      data: {
        phone,
        name: dto.name ?? dto.username,
        username: dto.username,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });
    this.logger.log(`Admin created: ${user.id} (${user.username})`);
    return user;
  }

  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
