import api from './api';

export interface DriverOrder {
  id: string;
  orderNumber: string;
  status: string;
  tankQuantity: number;
  totalPrice: number;
  paymentMethod?: string | null;
  paymentStatus: string;
  createdAt: string;
  estimatedDeliveryTime?: string | null;
  deliveredAt?: string | null;
  user: {
    id: string;
    name: string | null;
    phone: string;
  };
  vendor?: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  } | null;
  driver?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  address: {
    id: string;
    label?: string | null;
    street?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

export const driverOrderService = {
  async getAssigned(): Promise<DriverOrder[]> {
    const response = await api.get<DriverOrder[]>('/orders/driver/assigned');
    return response.data;
  },

  async getActive(): Promise<DriverOrder[]> {
    const response = await api.get<DriverOrder[]>('/orders/driver/active');
    return response.data;
  },

  async getHistory(): Promise<DriverOrder[]> {
    const response = await api.get<DriverOrder[]>('/orders/driver/history');
    return response.data;
  },
};

