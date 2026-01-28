import api from './api';

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
   * Create an order for the authenticated user.
   * The backend will use the user's default address and calculate pricing.
   * (If you want to explicitly choose address/payment later, extend this DTO.)
   */
  async createOrder(data: {
    tankQuantity: number;
    paymentMethod: string;
    addressId?: string;
  }): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
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
