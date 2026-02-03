// User Types
export enum UserRole {
  USER = 'USER',
  VENDOR = 'VENDOR',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole | string;
  createdAt: string;
  updatedAt?: string;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  userId: string;
  vendorId?: string;
  serviceProviderId?: string;
  addressId: string;
  status: OrderStatus;
  cylinderType?: string;
  quantity: number;
  /** Snapshot unit price at order time (gas = per cylinder, etc.) */
  unitPrice?: number | string;
  /** Snapshot service fee at order time */
  serviceFee?: number | string;
  /** Total order amount; may be returned as totalPrice from API */
  totalAmount: number;
  totalPrice?: number | string;
  notes?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  vendor?: Vendor;
  serviceProvider?: ServiceProvider;
  address?: Address;
  payment?: Payment;
}

// Vendor Types
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  licenseNumber?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  user?: User;
}

// Service Provider (technician or delivery person)
export interface ServiceProvider {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  extraInfo?: Record<string, unknown>;
  isAvailable: boolean;
  rating: number;
  totalJobs: number;
  createdAt: string;
  updatedAt?: string;
  vendor?: Vendor;
}

/** @deprecated Use ServiceProvider */
export type Driver = ServiceProvider;

// Address Types
export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  city: string;
  district?: string;
  coordinates?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Payment Types
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_WALLET = 'MOBILE_WALLET',
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  order?: Order;
  user?: User;
}

// Notification Types
export enum NotificationType {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  data?: string;
  createdAt: string;
  user?: User;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Auth Types
export interface CheckPhoneResponse {
  exists: boolean;
  accountType?: 'user' | 'service_provider';
  hasPassword: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Common Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CylinderType {
  id: string;
  name: string;
  size: string;
  price: number;
  weight: number;
}



