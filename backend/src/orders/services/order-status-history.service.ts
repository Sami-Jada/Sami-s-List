import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@samis-list/shared';

@Injectable()
export class OrderStatusHistoryService {
  private readonly logger = new Logger(OrderStatusHistoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new status history entry
   */
  async create(
    orderId: string,
    status: OrderStatus,
    notes?: string,
  ) {
    const historyEntry = await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        notes,
      },
    });

    this.logger.log(
      `Status history created for order ${orderId}: ${status}${notes ? ` - ${notes}` : ''}`,
    );

    return historyEntry;
  }

  /**
   * Find all status history entries for an order
   */
  async findByOrder(orderId: string) {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get the latest status for an order
   */
  async getLatestStatus(orderId: string) {
    const latest = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId },
      orderBy: { timestamp: 'desc' },
    });

    return latest;
  }
}



