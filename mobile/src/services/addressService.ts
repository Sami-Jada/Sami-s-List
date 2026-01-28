import api from './api';

export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface Address {
  id: string;
  label: AddressLabel;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  label: AddressLabel;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: AddressLabel;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const addressService = {
  async getMyAddresses(): Promise<Address[]> {
    const response = await api.get<Address[]>('/users/me/addresses');
    return response.data;
  },

  async createAddress(data: CreateAddressRequest): Promise<Address> {
    const response = await api.post<Address>('/users/me/addresses', data);
    return response.data;
  },

  async updateAddress(addressId: string, data: UpdateAddressRequest): Promise<Address> {
    const response = await api.patch<Address>(`/users/me/addresses/${addressId}`, data);
    return response.data;
  },

  async setDefaultAddress(addressId: string): Promise<Address> {
    const response = await api.put<Address>(`/users/me/addresses/${addressId}/default`);
    return response.data;
  },
};

