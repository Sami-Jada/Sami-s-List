import api from './api';
import { User } from '@shared';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  isGuest?: boolean;
}

export const authService = {
  async sendOtp(phone: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/send-otp', {
      phone,
    });
    return response.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/verify-otp', {
      phone,
      otp,
    });
    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user,
      isGuest: (response.data as any).isGuest,
    };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(updateData: { name?: string; email?: string }): Promise<User> {
    const response = await api.patch<User>('/users/me', updateData);
    return response.data;
  },

  async logout(): Promise<void> {
    // Token removal is handled by AuthContext
  },
};



