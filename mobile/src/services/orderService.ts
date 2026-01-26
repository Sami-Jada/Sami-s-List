import api from './api';
import { PaymentMethod } from '@shared';

export interface GuestOrderRequest {
  phone: string;
  address: {
    label: 'HOME' | 'WORK' | 'OTHER';
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
  };
  tankQuantity: number;
  paymentMethod: PaymentMethod;
}

export interface GuestOrderResponse {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    tankQuantity: number;
    totalPrice: string;
    estimatedDeliveryTime: string | null;
    address: {
      addressLine: string;
      city: string;
    };
    vendor: {
      name: string;
      distance: number;
    };
    user: {
      id: string;
      name: string;
      phone: string;
    };
  };
  accessToken: string;
  isGuest: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  tankQuantity: number;
  totalPrice: string;
  estimatedDeliveryTime: string | null;
  address: {
    addressLine: string;
    city: string;
  };
  vendor?: {
    name: string;
  };
}

export const orderService = {
  /**
   * Create a guest order (no authentication required)
   */
  async createGuestOrder(request: GuestOrderRequest): Promise<GuestOrderResponse> {
    const response = await api.post<GuestOrderResponse>('/orders/guest', request);
    return response.data;
  },

  /**
   * Get order status by ID (requires authentication or temporary token)
   */
  async getOrderStatus(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Get all orders for authenticated user
   */
  async getUserOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/my-orders');
    return response.data;
  },
};
