import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI, UserProfile } from '../services/api';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phone: string;
  setPhone: (phone: string) => void;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  phone: '',

  setPhone: (phone: string) => set({ phone }),

  setUser: (user: UserProfile | null) => set({ user }),

  setToken: (token: string | null) => set({ token, isAuthenticated: !!token }),

  login: async (token: string, user: UserProfile) => {
    try {
      const tokenStr = String(token || '');
      const userStr = JSON.stringify(user || {});
      if (tokenStr) {
        await SecureStore.setItemAsync('auth_token', tokenStr);
      }
      await SecureStore.setItemAsync('user', userStr);
      
      // Small delay to ensure SecureStore persists before state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({ token: tokenStr, user, isAuthenticated: !!tokenStr, isLoading: false });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user');
      set({ token: null, user: null, isAuthenticated: false, phone: '' });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('user');

      if (token && userStr) {
        const user = JSON.parse(userStr) as UserProfile;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      const user = response.data;
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
}));
