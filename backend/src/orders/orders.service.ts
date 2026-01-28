import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { DriversService } from '../drivers/drivers.service';
import { AddressesHelperService } from './services/addresses-helper.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderStatusHistoryService } from './services/order-status-history.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderStatus, PaymentStatus } from '@samis-list/shared';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AddressesService } from '../users/services/addresses.service';
import { TokenService } from '../auth/services/token.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService,
    private driversService: DriversService,
    private addressesHelper: AddressesHelperService,
    private statusHistoryService: OrderStatusHistoryService,
    private stateMachine: OrderStateMachineService,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
    private addressesService: AddressesService,
    private tokenService: TokenService,
  ) {}

  /**
   * Generate unique order number: GAS + timestamp + random 4 digits
   * Format: GAS20260124-15471234
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `GAS${year}${month}${day}-${hours}${minutes}${random}`;
  }

  /**
   * Calculate estimated delivery time based on distance
   * Rough estimate: 30-60 minutes (will be improved with real distance calculation)
   */
  private calculateEstimatedDeliveryTime(distanceKm?: number): Date {
    // Base time: 30 minutes
    // Add 1 minute per km (rough estimate)
    const baseMinutes = 30;
    const additionalMinutes = distanceKm ? Math.ceil(distanceKm) : 0;
    const totalMinutes = baseMinutes + additionalMinutes;
    
    // Cap at 60 minutes
    const finalMinutes = Math.min(totalMinutes, 60);
    
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + finalMinutes);
    
    return estimatedTime;
  }

  /**
   * Create a new order with complex business logic
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Validate address belongs to user
    const address = await this.addressesHelper.findOne(
      createOrderDto.addressId,
      userId,
    );

    // Find nearest active vendor using geolocation
    const nearestVendors = await this.vendorsService.findNearest(
      Number(address.latitude),
      Number(address.longitude),
      1, // Get only the nearest vendor
    );

    if (nearestVendors.length === 0) {
      throw new BadRequestException(
        'No active vendors found near the delivery address',
      );
    }

    const vendor = nearestVendors[0];

    // Calculate price
    const priceCalculation = await this.calculatePrice(
      vendor.id,
      createOrderDto.tankQuantity,
    );

    // Estimate delivery time
    const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
      vendor.distance,
    );

    // Use Prisma transaction for atomic operations
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          vendorId: vendor.id,
          addressId: createOrderDto.addressId,
          status: OrderStatus.PENDING,
          tankQuantity: createOrderDto.tankQuantity,
          tankPrice: priceCalculation.tankPrice,
          serviceFee: priceCalculation.serviceFee,
          totalPrice: priceCalculation.totalPrice,
          paymentMethod: createOrderDto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          estimatedDeliveryTime,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          vendor: true,
          address: true,
        },
      });

      // Create initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.PENDING,
          notes: 'Order created',
        },
      });

      return newOrder;
    });

    // Emit event for real-time notification
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      userId: order.userId,
      vendorId: order.vendorId,
      status: order.status,
    });

    this.logger.log(
      `Order created: ${order.orderNumber} (${order.id}) by user ${userId}`,
    );

    return {
      ...order,
      vendor: {
        ...order.vendor,
        distance: vendor.distance,
      },
      estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString() || null,
    };
  }

  /**
   * Find all orders with optional filters
   */
  async findAll(filters?: OrderFilterDto, currentUserId?: string, userRole?: string) {
    const where: Prisma.OrderWhereInput = {};

    // Apply filters
    if (filters?.userId) {
      where.userId = filters.userId;
    } else if (userRole === 'USER' && currentUserId) {
      // Users can only see their own orders
      where.userId = currentUserId;
    }

    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters?.driverId) {
      where.driverId = filters.driverId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    return this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Helper: resolve driver for the current authenticated user via phone mapping
   * Used for driver-specific order queries
   */
  private async getDriverForUser(userId: string) {
    const user = await this.usersService.findById(userId);

    // Map user.phone -> driver.phone
    const driver = await this.driversService.findByPhone(user.phone);

    if (!driver) {
      throw new ForbiddenException('Driver account not found for this user');
    }

    return driver;
  }

  /**
   * Driver-specific: get assigned orders for the current driver
   */
  async findAssignedForDriver(currentUserId: string) {
    const driver = await this.getDriverForUser(currentUserId);

    return this.prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: OrderStatus.ASSIGNED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Driver-specific: get active orders (ASSIGNED, EN_ROUTE) for the current driver
   */
  async findActiveForDriver(currentUserId: string) {
    const driver = await this.getDriverForUser(currentUserId);

    return this.prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: [OrderStatus.ASSIGNED, OrderStatus.EN_ROUTE],
        } as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Driver-specific: get history orders (DELIVERED, COMPLETED) for the current driver
   */
  async findHistoryForDriver(currentUserId: string) {
    const driver = await this.getDriverForUser(currentUserId);

    return this.prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
        } as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find order by ID with authorization check
   */
  async findById(orderId: string, currentUserId?: string, userRole?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' },
        },
        rating: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Authorization check
    if (userRole === 'USER' && order.userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  /**
   * Find orders by user ID
   */
  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: true,
        payment: true,
        statusHistory: {
          take: 3,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update order status with state machine validation
   */
  async updateStatus(
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
    changedBy: string,
  ) {
    const order = await this.findById(orderId);

    // Validate state transition
    this.stateMachine.validateTransition(order.status as OrderStatus, updateStatusDto.status as OrderStatus);

    // Use transaction for atomic update
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: updateStatusDto.status,
          // Set deliveredAt if status is DELIVERED
          ...(updateStatusDto.status === OrderStatus.DELIVERED && {
            deliveredAt: new Date(),
          }),
        },
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: updateStatusDto.status,
          notes: updateStatusDto.notes || `Status changed by ${changedBy}`,
        },
      });

      return order;
    });

    // Emit event for real-time notification
    this.eventEmitter.emit('order.status.changed', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      userId: updatedOrder.userId,
      vendorId: updatedOrder.vendorId,
      driverId: updatedOrder.driverId,
    });

    this.logger.log(
      `Order ${orderId} status changed from ${order.status} to ${updateStatusDto.status} by ${changedBy}`,
    );

    return updatedOrder;
  }

  /**
   * Assign driver to order
   */
  async assignDriver(orderId: string, assignDriverDto: AssignDriverDto) {
    const order = await this.findById(orderId);

    // Validate order is in ACCEPTED status
    if (order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException(
        `Cannot assign driver. Order must be in ACCEPTED status. Current status: ${order.status}`,
      );
    }

    // Verify driver exists and belongs to vendor
    const driver = await this.prisma.driver.findUnique({
      where: { id: assignDriverDto.driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${assignDriverDto.driverId} not found`);
    }

    if (driver.vendorId !== order.vendorId) {
      throw new BadRequestException(
        'Driver does not belong to the order vendor',
      );
    }

    if (!driver.isAvailable) {
      throw new BadRequestException('Driver is not available');
    }

    // Use transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order with driver and status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          driverId: assignDriverDto.driverId,
          status: OrderStatus.ASSIGNED,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.ASSIGNED,
          notes: `Driver ${driver.name} assigned`,
        },
      });

      return order;
    });

    // Emit event
    this.eventEmitter.emit('order.driver.assigned', {
      orderId: updatedOrder.id,
      driverId: assignDriverDto.driverId,
      userId: updatedOrder.userId,
    });

    this.logger.log(
      `Driver ${assignDriverDto.driverId} assigned to order ${orderId}`,
    );

    return updatedOrder;
  }

  /**
   * Calculate order price
   */
  async calculatePrice(vendorId: string, tankQuantity: number) {
    const vendor = await this.vendorsService.findById(vendorId);

    const tankPrice = Number(vendor.tankPrice);
    const serviceFee = Number(vendor.serviceFee);

    const totalTankPrice = tankPrice * tankQuantity;
    const totalPrice = totalTankPrice + serviceFee;

    return {
      tankPrice: tankPrice.toString(),
      serviceFee: serviceFee.toString(),
      totalPrice: totalPrice.toString(),
    };
  }

  /**
   * Cancel order with business rules
   */
  async cancelOrder(orderId: string, cancelDto: CancelOrderDto) {
    const order = await this.findById(orderId);

    // Check if order can be cancelled
    if (!this.stateMachine.canCancel(order.status as OrderStatus, cancelDto.cancelledBy)) {
      throw new BadRequestException(
        `Order cannot be cancelled by ${cancelDto.cancelledBy} from status ${order.status}`,
      );
    }

    // Use transaction
    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          notes: `Cancelled by ${cancelDto.cancelledBy}${cancelDto.reason ? `: ${cancelDto.reason}` : ''}`,
        },
      });

      return order;
    });

    // Emit event
    this.eventEmitter.emit('order.cancelled', {
      orderId: cancelledOrder.id,
      cancelledBy: cancelDto.cancelledBy,
      userId: cancelledOrder.userId,
      vendorId: cancelledOrder.vendorId,
    });

    this.logger.log(
      `Order ${orderId} cancelled by ${cancelDto.cancelledBy}${cancelDto.reason ? `: ${cancelDto.reason}` : ''}`,
    );

    return cancelledOrder;
  }

  /**
   * Complete order (mark as completed after delivery)
   */
  async completeOrder(orderId: string) {
    const order = await this.findById(orderId);

    // Validate order is in DELIVERED status
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Order must be in DELIVERED status to complete. Current status: ${order.status}`,
      );
    }

    // Use transaction
    const completedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.COMPLETED,
          notes: 'Order completed',
        },
      });

      // Update vendor total orders count
      if (order.vendorId) {
        await tx.vendor.update({
          where: { id: order.vendorId },
          data: {
            totalOrders: {
              increment: 1,
            },
          },
        });
      }

      // Update driver total deliveries count
      if (order.driverId) {
        await tx.driver.update({
          where: { id: order.driverId },
          data: {
            totalDeliveries: {
              increment: 1,
            },
          },
        });
      }

      return order;
    });

    // Update ratings (async, don't wait)
    if (completedOrder.vendorId) {
      this.vendorsService.updateRating(completedOrder.vendorId).catch((err) => {
        this.logger.error(`Failed to update vendor rating: ${err.message}`);
      });
    }

    if (completedOrder.driverId) {
      // TODO: Implement driver rating update when DriversService has the method
      // this.driversService.updateRating(completedOrder.driverId).catch((err) => {
      //   this.logger.error(`Failed to update driver rating: ${err.message}`);
      // });
    }

    // Emit event
    this.eventEmitter.emit('order.completed', {
      orderId: completedOrder.id,
      userId: completedOrder.userId,
      vendorId: completedOrder.vendorId,
      driverId: completedOrder.driverId,
    });

    this.logger.log(`Order ${orderId} completed`);

    return completedOrder;
  }
}
