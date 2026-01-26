import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Debug: Log API URL being used
console.log('========================================');
console.log('🔗 API SERVICE INITIALIZING');
console.log('📍 API URL:', API_URL);
console.log('📱 Expo Config API URL:', Constants.expoConfig?.extra?.apiUrl);
console.log('🌍 Environment:', Constants.expoConfig?.extra?.environment);
console.log('========================================');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url, { baseURL: config.baseURL });
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Only log errors, don't let them crash the app
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network')) {
          console.warn('⚠️ Network error (app will continue in guest mode):', error.message);
        } else {
          console.error('❌ API Error:', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            message: error.message,
            code: error.code,
          });
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            if (refreshToken) {
              // Attempt to refresh token
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken: refreshToken,
              });

              const { accessToken } = response.data;
              await SecureStore.setItemAsync('access_token', accessToken);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            // Navigate to login - handled by AuthContext
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get instance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService.instance;



