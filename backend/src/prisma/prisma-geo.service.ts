import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface VendorWithDistance {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  unitPrice: number | null;
  serviceFee: number | null;
  rating: number;
  isActive: boolean;
  distance?: number; // Distance in kilometers
}

@Injectable()
export class PrismaGeoService {
  constructor(private prisma: PrismaService) {}

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

  /**
   * Find nearest vendors to a given location
   * @param coordinates - User's location
   * @param maxDistance - Maximum distance in kilometers (default: 10km)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of vendors with distance calculated
   */
  async findNearestVendors(
    coordinates: Coordinates,
    maxDistance: number = 10,
    limit: number = 10,
  ): Promise<VendorWithDistance[]> {
    // Get all active vendors
    const vendors = await this.prisma.vendor.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        unitPrice: true,
        serviceFee: true,
        rating: true,
        isActive: true,
      },
    });

    // Calculate distance for each vendor and filter by maxDistance
    const vendorsWithDistance = vendors
      .map((vendor) => {
        const distance = this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          Number(vendor.latitude),
          Number(vendor.longitude),
        );

        return {
          ...vendor,
          latitude: Number(vendor.latitude),
          longitude: Number(vendor.longitude),
          unitPrice: vendor.unitPrice != null ? Number(vendor.unitPrice) : null,
          serviceFee: vendor.serviceFee != null ? Number(vendor.serviceFee) : null,
          distance,
        };
      })
      .filter((vendor) => vendor.distance <= maxDistance)
      .sort((a, b) => a.distance! - b.distance!)
      .slice(0, limit);

    return vendorsWithDistance;
  }

  /**
   * Find nearest available service providers to a given location
   * @param coordinates - Target location
   * @param vendorId - Optional vendor ID to filter service providers
   * @param maxDistance - Maximum distance in kilometers (default: 5km)
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of service providers with distance calculated
   */
  async findNearestDrivers(
    coordinates: Coordinates,
    vendorId?: string,
    maxDistance: number = 5,
    limit: number = 5,
  ) {
    const where: Prisma.ServiceProviderWhereInput = {
      isAvailable: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const drivers = await this.prisma.serviceProvider.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        vendorId: true,
        currentLatitude: true,
        currentLongitude: true,
        rating: true,
        isAvailable: true,
      },
    });

    const driversWithDistance = drivers
      .map((driver) => {
        if (!driver.currentLatitude || !driver.currentLongitude) {
          return null;
        }

        const distance = this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          Number(driver.currentLatitude),
          Number(driver.currentLongitude),
        );

        return {
          ...driver,
          currentLatitude: Number(driver.currentLatitude),
          currentLongitude: Number(driver.currentLongitude),
          distance,
        };
      })
      .filter((driver) => driver !== null && driver.distance! <= maxDistance)
      .sort((a, b) => a!.distance! - b!.distance!)
      .slice(0, limit);

    return driversWithDistance;
  }

  /**
   * Find vendors within a bounding box (for map view)
   * @param northEast - Northeast corner coordinates
   * @param southWest - Southwest corner coordinates
   * @returns Array of vendors within the bounding box
   */
  async findVendorsInBounds(
    northEast: Coordinates,
    southWest: Coordinates,
  ) {
    return this.prisma.vendor.findMany({
      where: {
        isActive: true,
        latitude: {
          gte: southWest.latitude,
          lte: northEast.latitude,
        },
        longitude: {
          gte: southWest.longitude,
          lte: northEast.longitude,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        unitPrice: true,
        serviceFee: true,
        rating: true,
        isActive: true,
      },
    });
  }

  /**
   * Calculate distance between an address and a vendor
   * @param addressId - Address ID
   * @param vendorId - Vendor ID
   * @returns Distance in kilometers
   */
  async calculateAddressToVendorDistance(
    addressId: string,
    vendorId: string,
  ): Promise<number | null> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!address || !vendor) {
      return null;
    }

    return this.calculateDistance(
      Number(address.latitude),
      Number(address.longitude),
      Number(vendor.latitude),
      Number(vendor.longitude),
    );
  }
}





