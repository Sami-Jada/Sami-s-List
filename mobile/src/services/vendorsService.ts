import api from './api';

export interface VendorListItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  rating: number;
  isActive: boolean;
  totalOrders?: number;
}

export async function getVendorsByServiceId(serviceId: string): Promise<VendorListItem[]> {
  const { data } = await api.get<VendorListItem[]>('/vendors', {
    params: { serviceId },
  });
  return data ?? [];
}

export const vendorsService = {
  getVendorsByServiceId,
};
