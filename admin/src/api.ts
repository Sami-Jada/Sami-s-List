const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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

export function listVendors(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  return api('/vendors');
}

export function listOrders(params?: Record<string, string>): Promise<unknown[]> {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  return api(`/orders${q}`);
}

export function getOrder(id: string): Promise<unknown> {
  return api(`/orders/${id}`);
}

export function listServiceProviders(vendorId: string): Promise<unknown[]> {
  return api(`/vendors/${vendorId}/service-providers`);
}
