import api from './api';
import { User, CheckPhoneResponse } from '@shared';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  isGuest?: boolean;
  isNewUser?: boolean;
}

/**
 * Helper function to retry a request on timeout/network errors
 * Only retries once with a 2 second delay
 */
async function retryOnTimeout<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 1,
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on timeout or network errors
      const isTimeout = error.code === 'ECONNABORTED' || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('exceeded');
      const isNetworkError = error.code === 'ECONNREFUSED' || 
                            error.code === 'ENOTFOUND' ||
                            error.message?.includes('Network');
      
      // Don't retry on 401/400 (invalid OTP) or if we've exhausted retries
      if (attempt >= maxRetries || (!isTimeout && !isNetworkError)) {
        throw error;
      }
      
      // Wait 2 seconds before retry (exponential backoff: 2^attempt seconds)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export const authService = {
  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    const response = await api.post<CheckPhoneResponse>('/auth/check-phone', {
      phone,
    });
    return response.data;
  },

  async loginWithPassword(phone: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      phone,
      password,
    });
    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user,
      isGuest: (response.data as any).isGuest,
      isNewUser: (response.data as any).isNewUser,
    };
  },

  async sendOtp(phone: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/send-otp', {
      phone,
    });
    return response.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<LoginResponse> {
    return retryOnTimeout(async () => {
      const response = await api.post<LoginResponse>('/auth/verify-otp', {
        phone,
        otp,
      });
      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
        isGuest: (response.data as any).isGuest,
        isNewUser: (response.data as any).isNewUser,
      };
    });
  },

  async setPassword(password: string): Promise<void> {
    await api.post('/auth/set-password', { password });
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



