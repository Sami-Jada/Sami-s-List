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

export const servicesService = {
  getPopularServices,
};
