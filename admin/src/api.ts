const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiBase(): string {
  return BASE_URL;
}

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const url = path.startsWith('http') ? path : `${BASE_URL}/api${path}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || 'Request failed');
  }
  return res.json();
}

/** Fetch with auth but no Content-Type (for FormData/multipart) */
async function apiMultipart<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = { ...(options.headers as Record<string, string>) };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const url = path.startsWith('http') ? path : `${BASE_URL}/api${path}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || 'Request failed');
  }
  return res.json();
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; role: string };
}

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  if (data.user?.role !== 'ADMIN') throw new Error('Admin access only');
  return data;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export function listAdmins(): Promise<AdminUser[]> {
  return api<AdminUser[]>('/admin/admins');
}

export function createAdmin(body: { username: string; password: string; name?: string }): Promise<AdminUser> {
  return api<AdminUser>('/admin/admins', { method: 'POST', body: JSON.stringify(body) });
}

// --- Categories (services) ---
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string | null;
  iconName: string;
  isPopular: boolean;
  sortOrder: number;
}

export function listServices(): Promise<ServiceCategory[]> {
  return api<ServiceCategory[]>('/services');
}

export function createService(body: {
  name: string;
  slug?: string;
  iconName: string;
  isPopular?: boolean;
  sortOrder?: number;
}): Promise<ServiceCategory> {
  return api<ServiceCategory>('/services', { method: 'POST', body: JSON.stringify(body) });
}

export function updateService(
  id: string,
  body: Partial<{ name: string; slug: string; iconName: string; isPopular: boolean; sortOrder: number }>
): Promise<ServiceCategory> {
  return api<ServiceCategory>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteService(id: string): Promise<void> {
  return api<void>(`/services/${id}`, { method: 'DELETE' });
}

// --- Vendors ---
export interface VendorServiceLinkDto {
  serviceId: string;
  unitPrice: number;
  serviceFee: number;
}

export interface VendorServiceLink {
  id: string;
  vendorId: string;
  serviceId: string;
  unitPrice: number | string;
  serviceFee: number | string;
  service?: { id: string; name: string; slug: string | null; iconName: string };
}

export interface VendorDetail {
  id: string;
  name: string;
  phone: string;
  businessLicense: string | null;
  address: string;
  latitude: number | string;
  longitude: number | string;
  description: string | null;
  imageUrl: string | null;
  openingHours: Record<string, { open: string; close: string } | null> | null;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  serviceLinks?: Array<{
    id: string;
    unitPrice: number | string | null;
    serviceFee: number | string | null;
    service: { id: string; name: string; slug: string | null; iconName: string };
  }>;
  serviceProviders?: Array<{ id: string; name: string; phone: string; isAvailable: boolean }>;
}

export interface CreateVendorPayload {
  name: string;
  phone: string;
  businessLicense?: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  openingHours: Record<string, { open: string; close: string } | null>;
  isActive?: boolean;
  services?: VendorServiceLinkDto[];
}

export function listVendors(): Promise<VendorDetail[]> {
  return api<VendorDetail[]>('/vendors');
}

export function getVendor(id: string): Promise<VendorDetail> {
  return api<VendorDetail>(`/vendors/${id}`);
}

export function createVendor(body: CreateVendorPayload): Promise<VendorDetail> {
  return api<VendorDetail>('/vendors', { method: 'POST', body: JSON.stringify(body) });
}

export function updateVendor(
  id: string,
  body: Partial<Omit<CreateVendorPayload, 'services'>>
): Promise<VendorDetail> {
  return api<VendorDetail>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function getVendorServices(vendorId: string): Promise<VendorServiceLink[]> {
  return api<VendorServiceLink[]>(`/vendors/${vendorId}/services`);
}

export function setVendorServices(
  vendorId: string,
  body: { services: VendorServiceLinkDto[] }
): Promise<VendorServiceLink[]> {
  return api<VendorServiceLink[]>(`/vendors/${vendorId}/services`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function uploadVendorImage(vendorId: string, file: File): Promise<VendorDetail> {
  const form = new FormData();
  form.append('file', file);
  return apiMultipart<VendorDetail>(`/vendors/${vendorId}/upload-image`, {
    method: 'PUT',
    body: form,
  });
}

export function toggleVendorActive(id: string): Promise<VendorDetail> {
  return api<VendorDetail>(`/vendors/${id}/toggle-active`, { method: 'PUT' });
}

// --- Service providers ---
export interface ServiceProvider {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  rating?: number;
  totalJobs?: number;
}

export function listServiceProviders(vendorId: string): Promise<ServiceProvider[]> {
  return api<ServiceProvider[]>(`/vendors/${vendorId}/service-providers`);
}

export function createServiceProvider(
  vendorId: string,
  body: { name: string; phone: string; password?: string }
): Promise<ServiceProvider> {
  return api<ServiceProvider>(`/vendors/${vendorId}/service-providers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// --- Orders (existing) ---
export function listOrders(params?: Record<string, string>): Promise<unknown[]> {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  return api(`/orders${q}`);
}

export function getOrder(id: string): Promise<unknown> {
  return api(`/orders/${id}`);
}
