import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService, LoginResponse } from '../services/authService';
import { User } from '@shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuestUser: boolean;
  isDriver: boolean;
  checkPhone: (phone: string) => Promise<import('@shared').CheckPhoneResponse>;
  loginWithPassword: (phone: string, password: string) => Promise<LoginResponse>;
  sendOtp: (phone: string) => Promise<{ message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<LoginResponse>;
  setPassword: (password: string) => Promise<void>;
  createPassword: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        // No token, skip API call entirely
        setUser(null);
        setIsDriver(false);
        setIsLoading(false);
        return;
      }
      
      // Only try to load user if we have a token
      // But don't let errors crash the app
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        // For now, treat a specific role flag on the user as driver indicator if available
        // Fallback: you can later replace this with an explicit "role" field.
        // @ts-expect-error: role field may not yet be on User type
        const hasDriverRole = (userData as User & { role?: string }).role === 'DRIVER';
        setIsDriver(hasDriverRole);
      } catch (error: any) {
        // Silently handle any errors - just clear token and continue as guest
        console.log('Failed to load user (continuing as guest):', error?.message || 'Unknown error');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        setUser(null);
        setIsDriver(false);
      }
    } catch (error: any) {
      // Silent fail - just continue without user
      setUser(null);
      setIsDriver(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPhone = async (phone: string) => {
    return await authService.checkPhone(phone);
  };

  const loginWithPassword = async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await authService.loginWithPassword(phone, password);
    await SecureStore.setItemAsync('access_token', response.accessToken);
    await SecureStore.setItemAsync('refresh_token', response.refreshToken);
    setUser(response.user);
    setIsDriver((response.user as User & { role?: string }).role === 'DRIVER');
    return response;
  };

  const sendOtp = async (phone: string) => {
    return await authService.sendOtp(phone);
  };

  const verifyOtp = async (phone: string, otp: string): Promise<LoginResponse> => {
    const response = await authService.verifyOtp(phone, otp);
    await SecureStore.setItemAsync('access_token', response.accessToken);
    await SecureStore.setItemAsync('refresh_token', response.refreshToken);
    setUser(response.user);
    setIsDriver((response.user as User & { role?: string }).role === 'DRIVER');
    return response;
  };

  const setPassword = async (password: string) => {
    await authService.setPassword(password);
  };

  const createPassword = async (name: string) => {
    if (!user) {
      throw new Error('User not found');
    }

    // Update user profile with name to convert from guest to registered
    // In this OTP-based system, "creating password" means completing profile
    const updatedUser = await authService.updateProfile({ name });
    setUser(updatedUser);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUser(null);
    setIsDriver(false);
  };

  // Check if user is a guest (empty name indicates guest user)
  const isGuestUser = user?.name === '' || user?.name === null || !user?.name;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isGuestUser,
        isDriver,
        checkPhone,
        loginWithPassword,
        sendOtp,
        verifyOtp,
        setPassword,
        createPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



