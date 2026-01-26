import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find all addresses for a user
   */
  async findByUserId(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { createdAt: 'desc' },
      ],
    });

    // Convert Decimal to number for response
    return addresses.map((address) => ({
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    }));
  }

  /**
   * Find address by ID and verify ownership
   * Returns address with Decimal coordinates (for internal use)
   */
  private async findOneInternal(addressId: string, userId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    return address;
  }

  /**
   * Find address by ID and verify ownership
   * Returns address with number coordinates (for API responses)
   */
  async findOne(addressId: string, userId: string) {
    const address = await this.findOneInternal(addressId, userId);

    // Convert Decimal to number for response
    return {
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    };
  }

  /**
   * Create a new address for user
   */
  async create(userId: string, createAddressDto: CreateAddressDto) {
    // Validate coordinates are within Jordan bounds
    this.validateJordanBounds(
      createAddressDto.latitude,
      createAddressDto.longitude,
    );

    // If setting as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const address = await this.prisma.address.create({
      data: {
        label: createAddressDto.label,
        addressLine: createAddressDto.addressLine,
        city: createAddressDto.city,
        latitude: createAddressDto.latitude,
        longitude: createAddressDto.longitude,
        isDefault: createAddressDto.isDefault || false,
        userId,
      },
    });

    this.logger.log(`Address created: ${address.id} for user ${userId}`);

    // Convert Decimal to number for response
    return {
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    };
  }

  /**
   * Update an address
   */
  async update(
    addressId: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    // Verify ownership
    await this.findOne(addressId, userId);

    // Get current address for coordinate validation
    const currentAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!currentAddress) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // Validate coordinates if provided
    if (updateAddressDto.latitude !== undefined || updateAddressDto.longitude !== undefined) {
      const latitude = updateAddressDto.latitude ?? Number(currentAddress.latitude);
      const longitude = updateAddressDto.longitude ?? Number(currentAddress.longitude);
      
      this.validateJordanBounds(latitude, longitude);
    }

    // If setting as default, unset other default addresses
    if (updateAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId, addressId);
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });

    this.logger.log(`Address updated: ${addressId} for user ${userId}`);

    // Convert Decimal to number for response
    return {
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    };
  }

  /**
   * Delete an address
   */
  async delete(addressId: string, userId: string) {
    // Verify ownership
    await this.findOneInternal(addressId, userId);

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    this.logger.log(`Address deleted: ${addressId} for user ${userId}`);
  }

  /**
   * Set an address as default and unset others
   */
  async setDefault(userId: string, addressId: string) {
    // Verify ownership
    await this.findOneInternal(addressId, userId);

    // Unset all other default addresses
    await this.unsetDefaultAddresses(userId, addressId);

    // Set this address as default
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    this.logger.log(`Default address set: ${addressId} for user ${userId}`);

    // Convert Decimal to number for response
    return {
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    };
  }

  /**
   * Unset all default addresses for a user (except the one being set)
   */
  private async unsetDefaultAddresses(userId: string, exceptId?: string) {
    const where: any = {
      userId,
      isDefault: true,
    };

    if (exceptId) {
      where.id = { not: exceptId };
    }

    await this.prisma.address.updateMany({
      where,
      data: { isDefault: false },
    });
  }

  /**
   * Validate coordinates are within Jordan bounds
   */
  private validateJordanBounds(latitude: number, longitude: number) {
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

