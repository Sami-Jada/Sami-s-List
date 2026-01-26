import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrderStateMachineService } from './order-state-machine.service';
import { OrderStatus } from '@samis-list/shared';

describe('OrderStateMachineService', () => {
  let service: OrderStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderStateMachineService],
    }).compile();

    service = module.get<OrderStateMachineService>(OrderStateMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isValidTransition', () => {
    it('should allow PENDING to ACCEPTED', () => {
      expect(
        service.isValidTransition(OrderStatus.PENDING, OrderStatus.ACCEPTED),
      ).toBe(true);
    });

    it('should allow PENDING to REJECTED', () => {
      expect(
        service.isValidTransition(OrderStatus.PENDING, OrderStatus.REJECTED),
      ).toBe(true);
    });

    it('should allow ACCEPTED to ASSIGNED', () => {
      expect(
        service.isValidTransition(OrderStatus.ACCEPTED, OrderStatus.ASSIGNED),
      ).toBe(true);
    });

    it('should allow ASSIGNED to EN_ROUTE', () => {
      expect(
        service.isValidTransition(OrderStatus.ASSIGNED, OrderStatus.EN_ROUTE),
      ).toBe(true);
    });

    it('should allow EN_ROUTE to DELIVERED', () => {
      expect(
        service.isValidTransition(OrderStatus.EN_ROUTE, OrderStatus.DELIVERED),
      ).toBe(true);
    });

    it('should allow DELIVERED to COMPLETED', () => {
      expect(
        service.isValidTransition(OrderStatus.DELIVERED, OrderStatus.COMPLETED),
      ).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(
        service.isValidTransition(OrderStatus.PENDING, OrderStatus.DELIVERED),
      ).toBe(false);
    });

    it('should allow same state (no-op)', () => {
      expect(
        service.isValidTransition(OrderStatus.PENDING, OrderStatus.PENDING),
      ).toBe(true);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => {
        service.validateTransition(OrderStatus.PENDING, OrderStatus.ACCEPTED);
      }).not.toThrow();
    });

    it('should throw BadRequestException for invalid transitions', () => {
      expect(() => {
        service.validateTransition(OrderStatus.PENDING, OrderStatus.DELIVERED);
      }).toThrow(BadRequestException);
    });
  });

  describe('canCancel', () => {
    it('should allow user to cancel PENDING order', () => {
      expect(service.canCancel(OrderStatus.PENDING, 'user')).toBe(true);
    });

    it('should allow user to cancel ACCEPTED order', () => {
      expect(service.canCancel(OrderStatus.ACCEPTED, 'user')).toBe(true);
    });

    it('should not allow user to cancel ASSIGNED order', () => {
      expect(service.canCancel(OrderStatus.ASSIGNED, 'user')).toBe(false);
    });

    it('should allow vendor to cancel before EN_ROUTE', () => {
      expect(service.canCancel(OrderStatus.PENDING, 'vendor')).toBe(true);
      expect(service.canCancel(OrderStatus.ACCEPTED, 'vendor')).toBe(true);
      expect(service.canCancel(OrderStatus.ASSIGNED, 'vendor')).toBe(true);
    });

    it('should not allow vendor to cancel EN_ROUTE order', () => {
      expect(service.canCancel(OrderStatus.EN_ROUTE, 'vendor')).toBe(false);
    });

    it('should allow driver to cancel ASSIGNED order', () => {
      expect(service.canCancel(OrderStatus.ASSIGNED, 'driver')).toBe(true);
    });

    it('should not allow driver to cancel EN_ROUTE order', () => {
      expect(service.canCancel(OrderStatus.EN_ROUTE, 'driver')).toBe(false);
    });

    it('should not allow cancellation of terminal states', () => {
      expect(service.canCancel(OrderStatus.CANCELLED, 'user')).toBe(false);
      expect(service.canCancel(OrderStatus.COMPLETED, 'user')).toBe(false);
      expect(service.canCancel(OrderStatus.REJECTED, 'user')).toBe(false);
    });
  });

  describe('isTerminalState', () => {
    it('should identify terminal states', () => {
      expect(service.isTerminalState(OrderStatus.CANCELLED)).toBe(true);
      expect(service.isTerminalState(OrderStatus.COMPLETED)).toBe(true);
      expect(service.isTerminalState(OrderStatus.REJECTED)).toBe(true);
    });

    it('should identify non-terminal states', () => {
      expect(service.isTerminalState(OrderStatus.PENDING)).toBe(false);
      expect(service.isTerminalState(OrderStatus.ACCEPTED)).toBe(false);
      expect(service.isTerminalState(OrderStatus.ASSIGNED)).toBe(false);
      expect(service.isTerminalState(OrderStatus.EN_ROUTE)).toBe(false);
      expect(service.isTerminalState(OrderStatus.DELIVERED)).toBe(false);
    });
  });

  describe('getValidNextStates', () => {
    it('should return valid next states for PENDING', () => {
      const nextStates = service.getValidNextStates(OrderStatus.PENDING);
      expect(nextStates).toContain(OrderStatus.ACCEPTED);
      expect(nextStates).toContain(OrderStatus.REJECTED);
      expect(nextStates).toContain(OrderStatus.CANCELLED);
    });

    it('should return empty array for terminal states', () => {
      expect(service.getValidNextStates(OrderStatus.COMPLETED)).toEqual([]);
      expect(service.getValidNextStates(OrderStatus.CANCELLED)).toEqual([]);
      expect(service.getValidNextStates(OrderStatus.REJECTED)).toEqual([]);
    });
  });
});



