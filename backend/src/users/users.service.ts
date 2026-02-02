import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
        role: true,
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
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find user by phone with auth info (hasPassword) for check-phone flow. Does not expose passwordHash.
   */
  async findByPhoneWithAuthInfo(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return { ...rest, hasPassword: !!passwordHash };
  }

  /**
   * Find user by phone including passwordHash (for auth password login only). Returns null if not found.
   */
  async findByPhoneWithPassword(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Set password for a user (customers). Hashes and stores passwordHash.
   */
  async setPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (user.role === 'DRIVER') {
      throw new BadRequestException('Drivers set password via driver account');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    this.logger.log(`Password set for user ${userId}`);
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
      data: {
        phone: createUserDto.phone,
        name: createUserDto.name ?? '',
        email: createUserDto.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User created: ${user.id} (${user.phone})`);

    return user;
  }

  /**
   * Update user profile
   * If user is converting from guest (name was empty), log the conversion
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    // Check if this is a guest-to-user conversion (name was empty, now being set)
    const isGuestConversion = user.name === '' && updateUserDto.name && updateUserDto.name.trim() !== '';

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
        role: true,
        updatedAt: true,
      },
    });

    if (isGuestConversion) {
      // Count orders for this user to log conversion
      const orderCount = await this.prisma.order.count({
        where: { userId: id },
      });
      this.logger.log(
        `Guest user converted to registered: ${id} (${user.phone}) - ${orderCount} existing orders`,
      );
    } else {
      this.logger.log(`User updated: ${id}`);
    }

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

  /**
   * Merge guest orders from a phone number into a registered user account
   * This is called when a user signs up with a phone that has existing guest orders
   */
  async mergeGuestOrders(phone: string, registeredUserId: string) {
    // Find guest user by phone (guest users have empty name)
    const guestUser = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        orders: true,
        addresses: true,
      },
    });

    if (!guestUser) {
      // No guest user found, nothing to merge
      this.logger.log(`No guest orders found for phone ${phone}`);
      return { merged: false, ordersCount: 0, addressesCount: 0 };
    }

    // Don't merge if it's the same user
    if (guestUser.id === registeredUserId) {
      this.logger.log(`User ${registeredUserId} is the same as guest user, skipping merge`);
      return { merged: false, ordersCount: 0, addressesCount: 0 };
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Transfer all orders from guest user to registered user
      const ordersUpdate = await tx.order.updateMany({
        where: { userId: guestUser.id },
        data: { userId: registeredUserId },
      });

      // Transfer all addresses from guest user to registered user
      const addressesUpdate = await tx.address.updateMany({
        where: { userId: guestUser.id },
        data: { userId: registeredUserId },
      });

      // Delete the guest user account (orders and addresses are now owned by registered user)
      await tx.user.delete({
        where: { id: guestUser.id },
      });

      return {
        ordersCount: ordersUpdate.count,
        addressesCount: addressesUpdate.count,
      };
    });

    this.logger.log(
      `Merged guest orders: ${result.ordersCount} orders and ${result.addressesCount} addresses from guest user ${guestUser.id} to registered user ${registeredUserId}`,
    );

    return {
      merged: true,
      ordersCount: result.ordersCount,
      addressesCount: result.addressesCount,
    };
  }
}
