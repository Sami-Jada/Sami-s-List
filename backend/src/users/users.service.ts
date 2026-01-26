import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto) {
    // Check if phone already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });

    if (existingUser) {
      throw new BadRequestException('Phone number already registered');
    }

    // Check if email already exists (if provided)
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    const user = await this.prisma.user.create({
      data: createUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User created: ${user.id} (${user.phone})`);

    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new BadRequestException('Email already registered');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User updated: ${id}`);

    return updatedUser;
  }

  /**
   * Delete user account (soft delete with data anonymization)
   */
  async delete(id: string) {
    const user = await this.findById(id);

    const timestamp = Date.now();
    const anonymizedPhone = `DELETED_${timestamp}`;

    // Anonymize user data (GDPR-style privacy)
    await this.prisma.user.update({
      where: { id },
      data: {
        phone: anonymizedPhone,
        name: '',
        email: null,
      },
    });

    // Note: Orders are kept for analytics but user data is anonymized
    // You may want to add a deletedAt timestamp field to User model for soft delete

    this.logger.warn(`User account deleted and anonymized: ${id} (original phone: ${user.phone})`);

    return {
      message: 'Account deleted successfully. Your data has been anonymized.',
    };
  }

  /**
   * Verify user owns the resource
   */
  async verifyOwnership(userId: string, resourceUserId: string) {
    if (userId !== resourceUserId) {
      throw new ForbiddenException('You do not have access to this resource');
    }
  }
}
