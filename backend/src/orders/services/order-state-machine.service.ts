import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@samis-list/shared';

/**
 * Order State Machine Service
 * Manages valid state transitions for orders
 */
@Injectable()
export class OrderStateMachineService {
  /**
   * Valid state transitions map
   */
  private readonly validTransitions: Map<OrderStatus, OrderStatus[]> = new Map([
    [OrderStatus.PENDING, [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED]],
    [OrderStatus.ACCEPTED, [OrderStatus.ASSIGNED, OrderStatus.CANCELLED]],
    [OrderStatus.ASSIGNED, [OrderStatus.EN_ROUTE, OrderStatus.CANCELLED]],
    [OrderStatus.EN_ROUTE, [OrderStatus.DELIVERED, OrderStatus.CANCELLED]],
    [OrderStatus.DELIVERED, [OrderStatus.COMPLETED]],
    [OrderStatus.REJECTED, []], // Terminal state
    [OrderStatus.COMPLETED, []], // Terminal state
    [OrderStatus.CANCELLED, []], // Terminal state
  ]);

  /**
   * Check if a state transition is valid
   */
  isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    // Same state is always valid (no-op)
    if (from === to) {
      return true;
    }

    // Check if transition is in valid transitions map
    const allowedTransitions = this.validTransitions.get(from);
    if (!allowedTransitions) {
      return false;
    }

    return allowedTransitions.includes(to);
  }

  /**
   * Validate state transition and throw error if invalid
   */
  validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.isValidTransition(from, to)) {
      throw new BadRequestException(
        `Invalid state transition from ${from} to ${to}. ` +
          `Allowed transitions from ${from}: ${this.validTransitions.get(from)?.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Check if order can be cancelled from current status
   */
  canCancel(currentStatus: OrderStatus, cancelledBy: 'user' | 'vendor' | 'service_provider'): boolean {
    // Terminal states cannot be cancelled
    if (
      currentStatus === OrderStatus.CANCELLED ||
      currentStatus === OrderStatus.COMPLETED ||
      currentStatus === OrderStatus.REJECTED
    ) {
      return false;
    }

    // User can only cancel if PENDING or ACCEPTED
    if (cancelledBy === 'user') {
      return (
        currentStatus === OrderStatus.PENDING || currentStatus === OrderStatus.ACCEPTED
      );
    }

    // Vendor can cancel anytime before EN_ROUTE
    if (cancelledBy === 'vendor') {
      return (
        currentStatus === OrderStatus.PENDING ||
        currentStatus === OrderStatus.ACCEPTED ||
        currentStatus === OrderStatus.ASSIGNED
      );
    }

    // Service provider can cancel if ASSIGNED (not yet en route)
    if (cancelledBy === 'service_provider') {
      return currentStatus === OrderStatus.ASSIGNED;
    }

    return false;
  }

  /**
   * Check if order is in a terminal state
   */
  isTerminalState(status: OrderStatus): boolean {
    return [
      OrderStatus.CANCELLED,
      OrderStatus.COMPLETED,
      OrderStatus.REJECTED,
    ].includes(status);
  }

  /**
   * Get all valid next states for a given status
   */
  getValidNextStates(currentStatus: OrderStatus): OrderStatus[] {
    return this.validTransitions.get(currentStatus) || [];
  }
}



