import api from './api';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string | null;
  iconName: string;
  isPopular: boolean;
  sortOrder: number;
}

export async function getPopularServices(): Promise<ServiceCategory[]> {
  const { data } = await api.get<ServiceCategory[]>('/services', {
    params: { popular: 'true' },
  });
  return data;
}

/** Get all categories (no popular filter). Used by Categories screen. */
export async function getAllCategories(): Promise<ServiceCategory[]> {
  const { data } = await api.get<ServiceCategory[]>('/services');
  return data;
}

export const servicesService = {
  getPopularServices,
  getAllCategories,
};
